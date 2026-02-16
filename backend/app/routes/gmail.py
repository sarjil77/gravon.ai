"""
API routes for Gmail integration — OAuth flow, connection management,
push notifications, and email operations.
"""

import logging
import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.database import supabase_admin
from app.schemas import (
    GmailConnectResponse,
    GmailConnectionResponse,
    GmailUpdateFiltersRequest,
    GmailProcessedMessageResponse,
)
from app.services.gmail_service import (
    get_oauth_url,
    create_connection,
    get_connections,
    delete_connection,
    handle_push_notification,
    start_gmail_watch,
    fetch_last_n_emails,
    renew_all_watches,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory state store for OAuth (short-lived, maps state → user_id)
# In production, use Redis or DB — this is fine for MVP.
_oauth_states: dict[str, str] = {}


# ── OAuth Flow ───────────────────────────────────────────────────────────────


@router.get("/connect")
async def gmail_connect(user_id: str):
    """
    Start Gmail OAuth flow. Returns the Google authorization URL.
    Frontend should redirect the user to this URL.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    # Generate a random state token to prevent CSRF
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = user_id

    auth_url = get_oauth_url(state)
    return GmailConnectResponse(auth_url=auth_url)


@router.get("/callback")
async def gmail_callback(code: str = "", state: str = "", error: str = ""):
    """
    OAuth callback from Google. Exchanges code for tokens,
    stores the connection, and starts Gmail watch.
    Redirects user back to the dashboard.
    """
    if error:
        logger.warning("Gmail OAuth error: %s", error)
        return RedirectResponse(url=f"/dashboard?gmail_error={error}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    # Validate state
    user_id = _oauth_states.pop(state, None)
    if not user_id:
        logger.warning("Invalid or expired OAuth state: %s", state)
        return RedirectResponse(url="/dashboard?gmail_error=invalid_state")

    try:
        connection = await create_connection(user_id, code)
        logger.info("Gmail connected for user %s: %s", user_id, connection["email_address"])
        return RedirectResponse(url=f"/dashboard?gmail_connected={connection['email_address']}")
    except Exception as e:
        logger.error("Gmail connection failed: %s", e)
        return RedirectResponse(url=f"/dashboard?gmail_error={str(e)[:100]}")


# ── Connection Management ────────────────────────────────────────────────────


@router.get("/connections")
async def list_connections(user_id: str):
    """List all Gmail connections for a user."""
    connections = get_connections(user_id)
    return {"connections": connections}


@router.patch("/connections/{connection_id}")
async def update_connection(connection_id: str, user_id: str, body: GmailUpdateFiltersRequest):
    """Update filters and/or linked tenant for a Gmail connection."""
    # Verify ownership
    conn = (
        supabase_admin.table("gmail_connections")
        .select("id")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    update_data: dict = {"filters": body.filters.model_dump()}
    if body.tenant_id is not None:
        # Verify tenant belongs to user
        tenant = (
            supabase_admin.table("tenants")
            .select("id")
            .eq("id", body.tenant_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not tenant.data:
            raise HTTPException(status_code=404, detail="Tenant not found")
        update_data["tenant_id"] = body.tenant_id

    result = (
        supabase_admin.table("gmail_connections")
        .update(update_data)
        .eq("id", connection_id)
        .execute()
    )
    return result.data[0] if result.data else {}


@router.delete("/connections/{connection_id}")
async def disconnect_gmail(connection_id: str, user_id: str):
    """Disconnect Gmail — stops watch and removes connection."""
    success = delete_connection(connection_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"deleted": True}


@router.post("/connections/{connection_id}/rewatch")
async def restart_watch(connection_id: str, user_id: str):
    """Manually restart the Gmail watch for a connection."""
    conn = (
        supabase_admin.table("gmail_connections")
        .select("*")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        result = start_gmail_watch(conn.data)
        return {"status": "watching", "expiration": result.get("expiration")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start watch: {e}")


# ── Email Operations ─────────────────────────────────────────────────────────


@router.get("/connections/{connection_id}/emails")
async def get_recent_emails(connection_id: str, user_id: str, count: int = 5):
    """Fetch the last N emails from the connected Gmail inbox."""
    conn = (
        supabase_admin.table("gmail_connections")
        .select("*")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    count = min(count, 20)  # Cap at 20
    emails = fetch_last_n_emails(conn.data, count)
    return {"emails": emails, "count": len(emails)}


@router.get("/connections/{connection_id}/history")
async def get_processed_history(connection_id: str, user_id: str, limit: int = 50):
    """Get the history of processed emails for a connection."""
    # Verify ownership
    conn = (
        supabase_admin.table("gmail_connections")
        .select("id, user_id")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    result = (
        supabase_admin.table("gmail_processed_messages")
        .select("*")
        .eq("connection_id", connection_id)
        .order("processed_at", desc=True)
        .limit(min(limit, 100))
        .execute()
    )
    return {"messages": result.data or []}


# ── Pub/Sub Push Endpoint ────────────────────────────────────────────────────


@router.post("/push")
async def gmail_push(request: Request):
    """
    Receives push notifications from Google Cloud Pub/Sub.
    Google sends POST with {"message": {"data": base64(...), "messageId": "..."}}
    Must return 200 quickly to acknowledge — processing happens async-ish.
    """
    try:
        body = await request.json()
        logger.info("Gmail push received: messageId=%s", body.get("message", {}).get("messageId"))
        result = await handle_push_notification(body)
        logger.info("Push result: %s", result)
        return {"status": "ok"}
    except Exception as e:
        logger.error("Push handler error: %s", e)
        # Return 200 anyway to prevent Google from retrying
        return {"status": "error", "detail": str(e)}


# ── Admin / Maintenance ──────────────────────────────────────────────────────


@router.post("/admin/renew-watches")
async def admin_renew_watches():
    """
    Renew all Gmail watches that expire within 24 hours.
    Call this from a cron job or scheduler.
    """
    count = renew_all_watches()
    return {"renewed": count}
