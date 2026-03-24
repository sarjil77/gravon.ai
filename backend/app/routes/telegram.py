"""
API routes for Telegram tenant provisioning and management.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.database import supabase_admin
from app.schemas import TenantCreateRequest, TenantResponse, TenantActionResponse
from app.services.tenant_service import (
    validate_telegram_token,
    provision_container,
    stop_container,
    start_container,
    restart_container,
    destroy_container,
)
from app.services.credit_service import get_balance, get_credit_cost, has_enough_credits

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_tenants(user_id: str):
    """List all tenants (bots) for a user."""
    result = (
        supabase_admin.table("tenants")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"tenants": result.data}


@router.post("/", response_model=TenantResponse)
async def create_tenant(user_id: str, body: TenantCreateRequest):
    """
    Create a new tenant:
    1. Validate the bot token via Telegram API
    2. Insert a tenant row
    3. Provision a Docker container running OpenClaw
    """
    logger.info("create_tenant called: user_id=%s model=%s", user_id, body.ai_model)

    # 0 — Check credit balance before deploying
    try:
        balance = get_balance(user_id)
        cost_per_msg = get_credit_cost(body.ai_model)
        if balance["balance"] < cost_per_msg:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient credits ({balance['balance']} remaining). "
                       f"Purchase more credits to deploy a bot.",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Credit check failed (allowing deploy): %s", e)

    # 1 — Validate token
    try:
        bot_info = await validate_telegram_token(body.bot_token)
        logger.info("Token validated: %s", bot_info.get("username"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if this bot token is already registered
    existing = (
        supabase_admin.table("tenants")
        .select("id")
        .eq("bot_token", body.bot_token)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="This bot token is already registered")

    # Check plan limits
    user_tenants = (
        supabase_admin.table("tenants")
        .select("id, plan")
        .eq("user_id", user_id)
        .execute()
    )
    # Determine max bots allowed
    user_row = supabase_admin.table("users").select("plan").eq("id", user_id).single().execute()
    user_plan = user_row.data.get("plan", "free") if user_row.data else "free"
    plan_limits = {"free": 1, "starter": 1, "pro": 3, "agency": 10}
    max_bots = plan_limits.get(user_plan, 1)

    if len(user_tenants.data) >= max_bots:
        raise HTTPException(
            status_code=403,
            detail=f"Your {user_plan} plan allows {max_bots} bot(s). Upgrade to add more.",
        )

    # Map user plan to tenant plan
    plan_map = {"free": "free_trial", "starter": "starter", "pro": "pro", "agency": "agency"}
    tenant_plan = plan_map.get(user_plan, "free_trial")

    # Credits are now managed in credit_balances table, but keep credits_limit
    # on tenant for backward compat. Show the user's current balance.
    user_balance = get_balance(user_id)
    credits_limit = user_balance["balance"]

    # 2 — Insert tenant row
    insert_data = {
        "user_id": user_id,
        "bot_token": body.bot_token,
        "bot_username": f"@{bot_info['username']}" if bot_info.get("username") else None,
        "ai_model": body.ai_model,
        "channel": body.channel,
        "status": "provisioning",
        "plan": tenant_plan,
        "credits_limit": credits_limit,
    }
    result = supabase_admin.table("tenants").insert(insert_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create tenant record")

    tenant = result.data[0]
    logger.info("Tenant inserted: %s", tenant["id"])

    # 3 — Provision container (async)
    try:
        logger.info("Starting provisioning for tenant %s", tenant["id"])
        container_info = await provision_container(
            tenant_id=tenant["id"],
            bot_token=body.bot_token,
            ai_model=body.ai_model,
            channel=body.channel,
            api_key=body.api_key,
        )
        logger.info("Provisioning complete: %s", container_info)
        # Refresh tenant data after provisioning
        refreshed = (
            supabase_admin.table("tenants")
            .select("*")
            .eq("id", tenant["id"])
            .single()
            .execute()
        )
        return refreshed.data
    except RuntimeError as e:
        logger.error("Provisioning failed: %s", e)
        # Return tenant with error status (already updated by service)
        refreshed = (
            supabase_admin.table("tenants")
            .select("*")
            .eq("id", tenant["id"])
            .single()
            .execute()
        )
        return refreshed.data


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str):
    """Get details of a specific tenant."""
    result = (
        supabase_admin.table("tenants")
        .select("*")
        .eq("id", tenant_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return result.data


@router.post("/{tenant_id}/stop", response_model=TenantActionResponse)
async def stop_tenant(tenant_id: str):
    """Stop a running tenant container."""
    tenant = supabase_admin.table("tenants").select("*").eq("id", tenant_id).single().execute()
    if not tenant.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.data.get("container_id"):
        raise HTTPException(status_code=400, detail="No container to stop")

    success = await stop_container(tenant_id, tenant.data["container_id"])
    return TenantActionResponse(
        tenant_id=tenant_id,
        action="stop",
        success=success,
        message="Container stopped" if success else "Failed to stop container",
    )


@router.post("/{tenant_id}/start", response_model=TenantActionResponse)
async def start_tenant(tenant_id: str):
    """Start a stopped tenant container."""
    tenant = supabase_admin.table("tenants").select("*").eq("id", tenant_id).single().execute()
    if not tenant.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.data.get("container_id"):
        raise HTTPException(status_code=400, detail="No container to start")

    success = await start_container(tenant_id, tenant.data["container_id"])
    return TenantActionResponse(
        tenant_id=tenant_id,
        action="start",
        success=success,
        message="Container started" if success else "Failed to start container",
    )


@router.post("/{tenant_id}/restart", response_model=TenantActionResponse)
async def restart_tenant(tenant_id: str):
    """Restart a tenant container."""
    tenant = supabase_admin.table("tenants").select("*").eq("id", tenant_id).single().execute()
    if not tenant.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.data.get("container_id"):
        raise HTTPException(status_code=400, detail="No container to restart")

    success = await restart_container(tenant_id, tenant.data["container_id"])
    return TenantActionResponse(
        tenant_id=tenant_id,
        action="restart",
        success=success,
        message="Container restarted" if success else "Failed to restart container",
    )


@router.delete("/{tenant_id}")
async def delete_tenant(tenant_id: str):
    """Destroy a tenant — stops and removes the container, deletes the record."""
    tenant = supabase_admin.table("tenants").select("*").eq("id", tenant_id).single().execute()
    if not tenant.data:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if tenant.data.get("container_id"):
        await destroy_container(tenant_id, tenant.data["container_id"])
    else:
        supabase_admin.table("tenants").delete().eq("id", tenant_id).execute()

    return {"deleted": True}


@router.get("/{tenant_id}/usage")
async def get_tenant_usage(tenant_id: str):
    """Get usage logs for a tenant."""
    result = (
        supabase_admin.table("usage_logs")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("logged_at", desc=True)
        .limit(100)
        .execute()
    )
    return {"usage": result.data}


@router.post("/{tenant_id}/sync-chat-id")
async def sync_telegram_chat_id_endpoint(tenant_id: str):
    """
    Capture the Telegram chat_id for a tenant by peeking at pending getUpdates.
    The user must have recently sent any message to the bot.
    On success the chat_id is stored in the tenant config folder.
    """
    from app.services.tenant_service import sync_telegram_chat_id
    try:
        result = await sync_telegram_chat_id(tenant_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to sync chat_id for tenant %s: %s", tenant_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to sync: {str(e)[:200]}")
