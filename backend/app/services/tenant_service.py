"""
Tenant provisioning service — validates bot tokens, spins up OpenClaw
Docker containers, and manages lifecycle (start / stop / restart / destroy).
"""

import json
import asyncio
import httpx
from typing import Any

from app.config import settings
from app.database import supabase_admin


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

def generate_openclaw_config(bot_token: str, ai_model: str, channel: str = "telegram") -> str:
    """Return a JSON5-compatible openclaw.json for the tenant container."""
    config: dict[str, Any] = {
        "agent": {
            "model": ai_model,
        },
        "channels": {},
        "models": {
            "providers": {
                "anthropic": {"apiKey": settings.anthropic_api_key},
                "openai": {"apiKey": settings.openai_api_key},
                "google": {"apiKey": settings.google_api_key},
            },
        },
        "gateway": {
            "port": 18789,
        },
    }

    if channel == "telegram":
        config["channels"]["telegram"] = {
            "botToken": bot_token,
            "dmPolicy": "open",
            "allowFrom": ["*"],
        }

    return json.dumps(config, indent=2)


# ── Docker Container Lifecycle ───────────────────────────────────────────────

_PORT_COUNTER_START = 19000  # We'll allocate ports starting here


async def _run_cmd(cmd: str) -> tuple[str, str, int]:
    """Run a shell command and return (stdout, stderr, returncode)."""
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return (
        stdout.decode().strip(),
        stderr.decode().strip(),
        proc.returncode or 0,
    )


async def _next_port() -> int:
    """Find the next available port by checking existing tenants."""
    result = (
        supabase_admin.table("tenants")
        .select("container_port")
        .not_.is_("container_port", "null")
        .order("container_port", desc=True)
        .limit(1)
        .execute()
    )
    if result.data and result.data[0].get("container_port"):
        return result.data[0]["container_port"] + 1
    return _PORT_COUNTER_START


async def provision_container(tenant_id: str, bot_token: str, ai_model: str, channel: str) -> dict:
    """
    Spin up an OpenClaw Docker container for a tenant.
    Returns {container_id, port} on success, raises on failure.
    """
    port = await _next_port()
    config_json = generate_openclaw_config(bot_token, ai_model, channel)

    container_name = f"gravon-tenant-{tenant_id[:8]}"

    # Build the docker run command
    # We pass the config via an environment variable and use the official image
    docker_cmd = (
        f"docker run -d "
        f"--name {container_name} "
        f"--restart unless-stopped "
        f"-p {port}:18789 "
        f"-e OPENCLAW_CONFIG='{config_json}' "
        f"ghcr.io/openclaw/openclaw:latest "
        f"openclaw gateway --port 18789"
    )

    stdout, stderr, rc = await _run_cmd(docker_cmd)

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
    _, stderr, rc = await _run_cmd(f"docker rm {container_id}")
    if rc == 0:
        supabase_admin.table("tenants").delete().eq("id", tenant_id).execute()
    return rc == 0
