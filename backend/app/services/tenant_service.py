"""
Tenant provisioning service — validates bot tokens, spins up OpenClaw
Docker containers, and manages lifecycle (start / stop / restart / destroy).
"""

import json
import asyncio
import os
import secrets
import subprocess
import tempfile
import logging
import httpx
from pathlib import Path
from typing import Any

from app.config import settings
from app.database import supabase_admin

logger = logging.getLogger(__name__)

# Map short model ids (from frontend) to OpenClaw provider/model strings
_MODEL_MAP: dict[str, str] = {
    "anthropic": "anthropic/claude-sonnet-4-5",
    "openai": "openai/gpt-4o",
    "gemini": "google/gemini-2.0-flash",
}

# Directory to store per-tenant OpenClaw configs
# On production (Linux), use a fixed host path that both the backend container
# and the tenant containers can access via the same path.
# On Windows (local dev), use a temp directory.
import platform
if platform.system() == "Linux":
    _CONFIG_DIR = Path("/opt/gravon/configs")
else:
    _CONFIG_DIR = Path(tempfile.gettempdir()) / "gravon_configs"
_CONFIG_DIR.mkdir(parents=True, exist_ok=True)


# ── Telegram Bot Token Validation ────────────────────────────────────────────

async def validate_telegram_token(bot_token: str) -> dict[str, Any]:
    """Call the Telegram getMe API to verify the token is valid."""
    url = f"https://api.telegram.org/bot{bot_token}/getMe"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        data = resp.json()
        if not data.get("ok"):
            raise ValueError(
                data.get("description", "Invalid bot token — please check with @BotFather")
            )
        bot_info = data["result"]
        return {
            "id": bot_info["id"],
            "username": bot_info.get("username", ""),
            "first_name": bot_info.get("first_name", ""),
        }


# ── OpenClaw Config Generation ───────────────────────────────────────────────

def generate_openclaw_config(bot_token: str, ai_model: str, channel: str = "telegram", api_key: str | None = None) -> str:
    """Return an openclaw.json config for the tenant container."""
    # Resolve full model identifier
    model_id = _MODEL_MAP.get(ai_model, ai_model)

    # Generate a random gateway token for this tenant
    gw_token = secrets.token_hex(32)

    config: dict[str, Any] = {
        # Pass API keys as environment variables (OpenClaw reads them natively)
        "env": {},
        # Use agents.defaults (not the deprecated "agent" key)
        "agents": {
            "defaults": {
                "model": {"primary": model_id},
            },
        },
        "channels": {},
        "gateway": {
            "port": 18789,
            "bind": "lan",
            "auth": {
                "mode": "token",
                "token": gw_token,
            },
        },
    }

    # Inject provider API keys as env vars
    # Prefer user-supplied key; fall back to server-wide keys from .env
    import logging
    _log = logging.getLogger(__name__)
    _log.info("generate_openclaw_config: api_key=%s model_id=%s", api_key[:20] + "..." if api_key else None, model_id)
    if api_key:
        # Detect provider from model_id and set the right env var
        if "anthropic" in model_id:
            config["env"]["ANTHROPIC_API_KEY"] = api_key
        elif "openai" in model_id:
            config["env"]["OPENAI_API_KEY"] = api_key
        elif "google" in model_id or "gemini" in model_id:
            config["env"]["GEMINI_API_KEY"] = api_key
        else:
            # Fallback: set for all providers
            config["env"]["ANTHROPIC_API_KEY"] = api_key
    else:
        # Use server-side keys from settings
        if settings.anthropic_api_key and not settings.anthropic_api_key.startswith("sk-your"):
            config["env"]["ANTHROPIC_API_KEY"] = settings.anthropic_api_key
        if settings.openai_api_key and not settings.openai_api_key.startswith("sk-your"):
            config["env"]["OPENAI_API_KEY"] = settings.openai_api_key
        if settings.google_api_key and not settings.google_api_key.startswith("your-"):
            config["env"]["GEMINI_API_KEY"] = settings.google_api_key

    if channel == "telegram":
        config["channels"]["telegram"] = {
            "enabled": True,
            "botToken": bot_token,
            "dmPolicy": "open",
            "allowFrom": ["*"],
        }

    # Enable Gmail hooks support.
    # When channel is "gmail", the Telegram channel is still needed for delivering
    # AI-generated email summaries/alerts to the user's Telegram bot.
    # When channel is "telegram", we also enable hooks so Gmail can be added later.
    hook_token = secrets.token_hex(16)
    config["hooks"] = {
        "enabled": True,
        "token": hook_token,
        "path": "/hooks",
        "presets": ["gmail"],
        "mappings": [
            {
                "match": {"path": "gmail"},
                "action": "agent",
                "wakeMode": "now",
                "name": "Gmail",
                "sessionKey": "hook:gmail:{{messages[0].id}}",
                "messageTemplate": (
                    "New email from {{messages[0].from}}\n"
                    "Subject: {{messages[0].subject}}\n"
                    "{{messages[0].snippet}}\n"
                    "{{messages[0].body}}"
                ),
                "deliver": True,
                "channel": "telegram" if channel == "telegram" or bot_token else "last",
            },
        ],
    }

    return json.dumps(config, indent=2)


# ── Docker Container Lifecycle ───────────────────────────────────────────────

_PORT_COUNTER_START = 19000  # We'll allocate ports starting here


def _run_cmd_sync(cmd: str) -> tuple[str, str, int]:
    """Run a shell command synchronously and return (stdout, stderr, returncode)."""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        timeout=120,
    )
    return (
        result.stdout.strip(),
        result.stderr.strip(),
        result.returncode,
    )


async def _run_cmd(cmd: str) -> tuple[str, str, int]:
    """Run a shell command in a thread pool (safe on Windows with any event loop)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_cmd_sync, cmd)


def _get_docker_used_ports_sync() -> set[int]:
    """Get all host ports currently mapped by Docker containers."""
    import re
    result = subprocess.run(
        'docker ps --format "{{.Ports}}"',
        shell=True, capture_output=True, text=True, timeout=10,
    )
    if result.returncode != 0:
        return set()
    ports = set()
    for match in re.finditer(r'0\.0\.0\.0:(\d+)->', result.stdout):
        ports.add(int(match.group(1)))
    return ports


async def _next_port() -> int:
    """Find the next available port by checking existing tenants AND Docker."""
    result = (
        supabase_admin.table("tenants")
        .select("container_port")
        .not_.is_("container_port", "null")
        .order("container_port", desc=True)
        .limit(1)
        .execute()
    )
    candidate = _PORT_COUNTER_START
    if result.data and result.data[0].get("container_port"):
        candidate = result.data[0]["container_port"] + 1

    # Ask Docker which host ports are actually bound right now
    loop = asyncio.get_event_loop()
    docker_ports = await loop.run_in_executor(None, _get_docker_used_ports_sync)
    logger.info("Docker occupied ports: %s, candidate: %d", docker_ports, candidate)

    # Scan up to 50 ports to find one not used by Docker
    for offset in range(50):
        port = candidate + offset
        if port not in docker_ports:
            logger.info("Selected free port: %d", port)
            return port

    # Fallback
    return candidate


async def _cleanup_existing_container(container_name: str) -> None:
    """Remove any existing container with the same name (stopped or running)."""
    # Check if container exists
    stdout, _, rc = await _run_cmd(f"docker inspect {container_name}")
    if rc == 0:
        logger.info("Removing existing container %s before re-provisioning", container_name)
        await _run_cmd(f"docker stop {container_name}")
        await _run_cmd(f"docker rm -f {container_name}")


async def provision_container(tenant_id: str, bot_token: str, ai_model: str, channel: str, api_key: str | None = None) -> dict:
    """
    Spin up an OpenClaw Docker container for a tenant.
    Returns {container_id, port} on success, raises on failure.
    """
    port = await _next_port()
    config_json = generate_openclaw_config(bot_token, ai_model, channel, api_key=api_key)

    container_name = f"gravon-tenant-{tenant_id[:8]}"

    # Clean up any leftover container with the same name (from a failed prior run)
    await _cleanup_existing_container(container_name)

    # Delete any stale Telegram webhook so OpenClaw polling works immediately
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(f"https://api.telegram.org/bot{bot_token}/deleteWebhook")
            logger.info("Deleted Telegram webhook for clean polling start")
    except Exception as e:
        logger.warning("Could not delete Telegram webhook: %s", e)

    # Write config to a per-tenant directory (OpenClaw needs write access beside the config)
    tenant_dir = _CONFIG_DIR / tenant_id
    tenant_dir.mkdir(parents=True, exist_ok=True)
    config_path = tenant_dir / "openclaw.json"
    config_path.write_text(config_json, encoding="utf-8")

    # Ensure the directory is writable by the container's node user (UID 1000)
    import platform
    if platform.system() == "Linux":
        # chown to node user so OpenClaw container can read AND write
        await _run_cmd(f'chown -R 1000:1000 "{tenant_dir}"')

    # The mount path must be the SAME path on the host filesystem.
    # In production, both backend and tenant containers see /opt/gravon/configs via bind mount.
    # On Windows (local dev), we use the temp dir path directly.
    dir_mount = str(tenant_dir).replace("\\", "/")

    # Build the docker run command
    # Mount the config directory to ~/.openclaw (default path OpenClaw looks at)
    # This lets OpenClaw read AND write (doctor auto-fix, sessions, etc.)
    # Include DNS and host networking so OpenClaw can reach external APIs (Telegram, etc.)
    docker_cmd = (
        f'docker run -d '
        f'--name {container_name} '
        f'--restart unless-stopped '
        f'--network gravon '
        f'--dns 8.8.8.8 --dns 8.8.4.4 '
        f'--add-host host.docker.internal:host-gateway '
        f'-p {port}:18789 '
        f'-v "{dir_mount}:/home/node/.openclaw" '
        f'ghcr.io/openclaw/openclaw:latest'
    )

    logger.info("Running Docker command: %s", docker_cmd)
    stdout, stderr, rc = await _run_cmd(docker_cmd)
    logger.info("Docker result: rc=%d stdout=%s stderr=%s", rc, stdout[:80], stderr[:200])

    if rc != 0:
        # Update tenant status to error
        supabase_admin.table("tenants").update({
            "status": "error",
            "error_message": stderr[:500],
        }).eq("id", tenant_id).execute()
        raise RuntimeError(f"Docker provisioning failed: {stderr[:300]}")

    container_id = stdout[:12]  # short container ID

    # Update tenant record
    supabase_admin.table("tenants").update({
        "container_id": container_id,
        "container_port": port,
        "status": "running",
        "error_message": None,
    }).eq("id", tenant_id).execute()

    return {"container_id": container_id, "port": port}


async def stop_container(tenant_id: str, container_id: str) -> bool:
    """Stop a running tenant container."""
    _, stderr, rc = await _run_cmd(f"docker stop {container_id}")
    new_status = "stopped" if rc == 0 else "error"
    supabase_admin.table("tenants").update({
        "status": new_status,
        "error_message": stderr[:500] if rc != 0 else None,
    }).eq("id", tenant_id).execute()
    return rc == 0


async def start_container(tenant_id: str, container_id: str) -> bool:
    """Start a stopped tenant container."""
    _, stderr, rc = await _run_cmd(f"docker start {container_id}")
    new_status = "running" if rc == 0 else "error"
    supabase_admin.table("tenants").update({
        "status": new_status,
        "error_message": stderr[:500] if rc != 0 else None,
    }).eq("id", tenant_id).execute()
    return rc == 0


async def restart_container(tenant_id: str, container_id: str) -> bool:
    """Restart a tenant container."""
    _, stderr, rc = await _run_cmd(f"docker restart {container_id}")
    new_status = "running" if rc == 0 else "error"
    supabase_admin.table("tenants").update({
        "status": new_status,
        "error_message": stderr[:500] if rc != 0 else None,
    }).eq("id", tenant_id).execute()
    return rc == 0


async def destroy_container(tenant_id: str, container_id: str) -> bool:
    """Stop and remove a tenant container."""
    await _run_cmd(f"docker stop {container_id}")
    await _run_cmd(f"docker rm {container_id}")
    # Always delete the Supabase row & config, even if container was already gone
    supabase_admin.table("tenants").delete().eq("id", tenant_id).execute()
    # Clean up config directory
    tenant_dir = _CONFIG_DIR / tenant_id
    if tenant_dir.exists():
        import shutil
        shutil.rmtree(tenant_dir, ignore_errors=True)
    return True
