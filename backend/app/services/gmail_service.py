"""
Gmail integration service — handles OAuth, Gmail API, Pub/Sub watch,
push notification processing, and OpenClaw webhook bridging.
"""

import base64
import logging
import re
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from typing import Any

import httpx
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings
from app.database import supabase_admin

logger = logging.getLogger(__name__)

# Google OAuth scopes
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]

# ── OAuth Helpers ────────────────────────────────────────────────────────────


def get_oauth_url(state: str) -> str:
    """Generate Google OAuth authorization URL."""
    params = {
        "client_id": settings.gmail_client_id,
        "redirect_uri": settings.gmail_redirect_uri,
        "response_type": "code",
        "scope": " ".join(GMAIL_SCOPES),
        "access_type": "offline",
        "prompt": "consent",  # force consent to get refresh_token
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


async def exchange_code_for_tokens(code: str) -> dict[str, Any]:
    """Exchange authorization code for access + refresh tokens."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.gmail_client_id,
                "client_secret": settings.gmail_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.gmail_redirect_uri,
            },
        )
        if resp.status_code != 200:
            logger.error("Token exchange failed: %s", resp.text)
            raise ValueError(f"Token exchange failed: {resp.text}")
        return resp.json()


async def get_gmail_user_email(access_token: str) -> str:
    """Get the user's Gmail address using the access token."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise ValueError("Failed to get user info")
        return resp.json()["email"]


def _build_credentials(connection: dict) -> Credentials:
    """Build google-auth Credentials from a stored connection row."""
    creds = Credentials(
        token=connection.get("access_token"),
        refresh_token=connection["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.gmail_client_id,
        client_secret=settings.gmail_client_secret,
        scopes=GMAIL_SCOPES,
    )
    # Check expiry
    expires_at = connection.get("token_expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            creds.expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).replace(tzinfo=None)
        else:
            creds.expiry = expires_at.replace(tzinfo=None)
    return creds


def _refresh_if_needed(creds: Credentials, connection_id: str) -> Credentials:
    """Refresh the access token if expired, and persist the new one."""
    if creds.expired or not creds.valid:
        creds.refresh(GoogleAuthRequest())
        # Persist refreshed token
        expiry = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry else None
        supabase_admin.table("gmail_connections").update({
            "access_token": creds.token,
            "token_expires_at": expiry.isoformat() if expiry else None,
        }).eq("id", connection_id).execute()
        logger.info("Refreshed access token for connection %s", connection_id)
    return creds


def _get_gmail_service(connection: dict):
    """Build an authenticated Gmail API service object."""
    creds = _build_credentials(connection)
    creds = _refresh_if_needed(creds, connection["id"])
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


# ── Gmail Watch (Pub/Sub) ────────────────────────────────────────────────────


def start_gmail_watch(connection: dict) -> dict:
    """
    Call gmail.users.watch() to subscribe to push notifications.
    Returns the watch response with historyId and expiration.
    """
    service = _get_gmail_service(connection)
    topic = settings.gmail_pubsub_topic
    if not topic:
        raise ValueError("GMAIL_PUBSUB_TOPIC not configured")

    body = {
        "topicName": topic,
        "labelIds": ["INBOX"],
    }
    result = service.users().watch(userId="me", body=body).execute()
    logger.info("Gmail watch started for %s: %s", connection["email_address"], result)

    # Update DB with watch expiry and historyId
    expiry_ms = int(result.get("expiration", 0))
    expiry_dt = datetime.fromtimestamp(expiry_ms / 1000, tz=timezone.utc) if expiry_ms else None

    supabase_admin.table("gmail_connections").update({
        "history_id": str(result.get("historyId", "")),
        "watch_expiry": expiry_dt.isoformat() if expiry_dt else None,
    }).eq("id", connection["id"]).execute()

    return result


def stop_gmail_watch(connection: dict) -> None:
    """Stop the Gmail push watch for a connection."""
    try:
        service = _get_gmail_service(connection)
        service.users().stop(userId="me").execute()
        logger.info("Gmail watch stopped for %s", connection["email_address"])
    except Exception as e:
        logger.warning("Failed to stop gmail watch: %s", e)


def renew_all_watches() -> int:
    """Renew watches that expire within the next 24 hours. Returns count renewed."""
    cutoff = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    connections = (
        supabase_admin.table("gmail_connections")
        .select("*")
        .eq("is_active", True)
        .lt("watch_expiry", cutoff)
        .execute()
    )
    count = 0
    for conn in connections.data or []:
        try:
            start_gmail_watch(conn)
            count += 1
            logger.info("Renewed watch for %s", conn["email_address"])
        except Exception as e:
            logger.error("Failed to renew watch for %s: %s", conn["email_address"], e)
    return count


# ── Email Fetching ───────────────────────────────────────────────────────────


def fetch_new_emails(connection: dict, max_results: int = 10) -> list[dict]:
    """
    Fetch new emails since the last known history_id.
    Falls back to fetching recent unread if no history_id.
    """
    service = _get_gmail_service(connection)
    history_id = connection.get("history_id")

    message_ids: list[str] = []

    if history_id:
        # Use history API for incremental sync
        try:
            history = service.users().history().list(
                userId="me",
                startHistoryId=history_id,
                historyTypes=["messageAdded"],
                labelId="INBOX",
            ).execute()

            new_history_id = history.get("historyId")
            if new_history_id:
                supabase_admin.table("gmail_connections").update({
                    "history_id": str(new_history_id),
                }).eq("id", connection["id"]).execute()

            for record in history.get("history", []):
                for msg in record.get("messagesAdded", []):
                    msg_id = msg["message"]["id"]
                    message_ids.append(msg_id)
        except Exception as e:
            logger.warning("History fetch failed (will fall back): %s", e)
            history_id = None

    if not history_id:
        # Fallback: fetch recent unread
        result = service.users().messages().list(
            userId="me",
            q="is:unread in:inbox newer_than:15m",
            maxResults=max_results,
        ).execute()
        message_ids = [m["id"] for m in result.get("messages", [])]

    # Deduplicate against already-processed messages
    if message_ids:
        existing = (
            supabase_admin.table("gmail_processed_messages")
            .select("gmail_message_id")
            .eq("connection_id", connection["id"])
            .in_("gmail_message_id", message_ids)
            .execute()
        )
        seen = {r["gmail_message_id"] for r in (existing.data or [])}
        message_ids = [mid for mid in message_ids if mid not in seen]

    # Fetch full message details
    emails = []
    for msg_id in message_ids[:max_results]:
        try:
            msg = service.users().messages().get(
                userId="me", id=msg_id, format="full"
            ).execute()
            parsed = _parse_email(msg)
            if parsed:
                emails.append(parsed)
        except Exception as e:
            logger.warning("Failed to fetch message %s: %s", msg_id, e)

    return emails


def fetch_last_n_emails(connection: dict, count: int = 5) -> list[dict]:
    """Fetch the last N emails from inbox (for on-demand queries)."""
    service = _get_gmail_service(connection)
    result = service.users().messages().list(
        userId="me",
        q="in:inbox",
        maxResults=count,
    ).execute()

    emails = []
    for m in result.get("messages", [])[:count]:
        try:
            msg = service.users().messages().get(
                userId="me", id=m["id"], format="full"
            ).execute()
            parsed = _parse_email(msg)
            if parsed:
                emails.append(parsed)
        except Exception as e:
            logger.warning("Failed to fetch message %s: %s", m["id"], e)

    return emails


def _parse_email(msg: dict) -> dict | None:
    """Extract useful fields from a Gmail message object."""
    headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
    from_addr = headers.get("from", "")
    subject = headers.get("subject", "")
    date = headers.get("date", "")
    to_addr = headers.get("to", "")

    # Extract body (plain text preferred, fall back to snippet)
    body = _extract_body(msg.get("payload", {}))
    if not body:
        body = msg.get("snippet", "")

    return {
        "id": msg["id"],
        "threadId": msg.get("threadId", ""),
        "from": from_addr,
        "to": to_addr,
        "subject": subject,
        "date": date,
        "snippet": msg.get("snippet", ""),
        "body": body[:3000],  # Truncate to avoid huge payloads
        "labels": msg.get("labelIds", []),
    }


def _extract_body(payload: dict) -> str:
    """Recursively extract plain text body from Gmail payload."""
    if payload.get("mimeType") == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    # Check multipart parts
    for part in payload.get("parts", []):
        text = _extract_body(part)
        if text:
            return text

    return ""


# ── Filter Matching ──────────────────────────────────────────────────────────


def matches_filters(email: dict, filters: dict) -> bool:
    """Check if an email matches the user's configured filters."""
    # If no filters set, match everything
    if not filters or filters == {}:
        return True

    from_addrs = filters.get("from_addresses", [])
    subject_keywords = filters.get("subject_contains", [])
    has_attachment = filters.get("has_attachment")

    # From filter
    if from_addrs:
        email_from = email.get("from", "").lower()
        if not any(addr.lower() in email_from for addr in from_addrs):
            return False

    # Subject filter
    if subject_keywords:
        email_subject = email.get("subject", "").lower()
        if not any(kw.lower() in email_subject for kw in subject_keywords):
            return False

    # Attachment filter (check labels — Gmail doesn't have a direct attachment label easily)
    # Skip for now — can be implemented via payload inspection

    return True


# ── OpenClaw Bridge ──────────────────────────────────────────────────────────


async def forward_to_openclaw(tenant_id: str, emails: list[dict]) -> bool:
    """
    Forward emails to the tenant's OpenClaw container via /hooks/gmail endpoint.
    The OpenClaw container must have hooks enabled with gmail preset.
    """
    # Look up the tenant's container port and hook token
    tenant = (
        supabase_admin.table("tenants")
        .select("container_port, status")
        .eq("id", tenant_id)
        .single()
        .execute()
    )
    if not tenant.data or tenant.data["status"] != "running":
        logger.warning("Tenant %s not running, cannot forward emails", tenant_id)
        return False

    port = tenant.data["container_port"]
    # Read hooks token from the OpenClaw config
    from pathlib import Path
    import json
    import platform

    if platform.system() == "Linux":
        config_dir = Path("/opt/gravon/configs")
    else:
        import tempfile
        config_dir = Path(tempfile.gettempdir()) / "gravon_configs"

    config_path = config_dir / tenant_id / "openclaw.json"
    hook_token = ""
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
            hook_token = config.get("hooks", {}).get("token", "")
        except Exception:
            pass

    if not hook_token:
        logger.error("No hook token found for tenant %s", tenant_id)
        return False

    # Format emails for OpenClaw gmail hook
    payload = {
        "source": "gmail",
        "messages": [
            {
                "id": e["id"],
                "from": e["from"],
                "to": e.get("to", ""),
                "subject": e["subject"],
                "snippet": e["snippet"],
                "body": e["body"][:2000],
            }
            for e in emails
        ],
    }

    # Use host.docker.internal to reach tenant containers mapped to host ports.
    # Falls back to localhost for local dev (non-Docker).
    import platform
    host = "host.docker.internal" if platform.system() == "Linux" else "localhost"
    hook_url = f"http://{host}:{port}/hooks/gmail"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                hook_url,
                json=payload,
                headers={"Authorization": f"Bearer {hook_token}"},
            )
            logger.info(
                "Forwarded %d emails to OpenClaw (%s:%d): %d %s",
                len(emails), host, port, resp.status_code, resp.text[:200],
            )
            return resp.status_code in (200, 202)
    except Exception as e:
        logger.error("Failed to forward to OpenClaw (%s): %s", hook_url, e)
        return False


# ── Gmail Reply ──────────────────────────────────────────────────────────────


def send_gmail_reply(connection: dict, thread_id: str, to: str, subject: str, body_text: str) -> bool:
    """Send a reply email via Gmail API."""
    service = _get_gmail_service(connection)

    message = MIMEText(body_text)
    message["to"] = to
    message["subject"] = f"Re: {subject}" if not subject.startswith("Re:") else subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    try:
        service.users().messages().send(
            userId="me",
            body={"raw": raw, "threadId": thread_id},
        ).execute()
        logger.info("Sent reply to %s in thread %s", to, thread_id)
        return True
    except Exception as e:
        logger.error("Failed to send reply: %s", e)
        return False


# ── Push Notification Handler ────────────────────────────────────────────────


async def handle_push_notification(data: dict) -> dict:
    """
    Handle a Gmail Pub/Sub push notification.
    Google sends: {"message": {"data": base64({"emailAddress": "...", "historyId": "..."})}}
    """
    try:
        message = data.get("message", {})
        raw_data = message.get("data", "")
        decoded = base64.b64decode(raw_data).decode("utf-8")

        import json
        payload = json.loads(decoded)
        email_address = payload.get("emailAddress", "")
        new_history_id = payload.get("historyId", "")

        logger.info("Gmail push for %s, historyId=%s", email_address, new_history_id)

        if not email_address:
            return {"status": "ignored", "reason": "no email address"}

        # Look up the connection for this email
        connections = (
            supabase_admin.table("gmail_connections")
            .select("*")
            .eq("email_address", email_address)
            .eq("is_active", True)
            .execute()
        )

        if not connections.data:
            logger.info("No active connection for %s", email_address)
            return {"status": "ignored", "reason": "no connection found"}

        results = []
        for conn in connections.data:
            try:
                result = await _process_connection_push(conn, new_history_id)
                results.append(result)
            except Exception as e:
                logger.error("Error processing push for connection %s: %s", conn["id"], e)
                results.append({"connection_id": conn["id"], "error": str(e)})

        return {"status": "processed", "results": results}

    except Exception as e:
        logger.error("Failed to handle push notification: %s", e)
        return {"status": "error", "reason": str(e)}


async def _process_connection_push(connection: dict, new_history_id: str) -> dict:
    """Process a push notification for a specific gmail connection."""
    # Fetch new emails
    emails = fetch_new_emails(connection)

    if not emails:
        return {"connection_id": connection["id"], "emails_found": 0}

    # Apply filters
    filtered = [e for e in emails if matches_filters(e, connection.get("filters", {}))]

    if not filtered:
        return {"connection_id": connection["id"], "emails_found": len(emails), "matched_filters": 0}

    # Forward to OpenClaw if a tenant is linked
    forwarded = False
    if connection.get("tenant_id"):
        forwarded = await forward_to_openclaw(connection["tenant_id"], filtered)

    # Record processed messages
    for email in filtered:
        try:
            supabase_admin.table("gmail_processed_messages").insert({
                "connection_id": connection["id"],
                "gmail_message_id": email["id"],
                "from_address": email.get("from", ""),
                "subject": email.get("subject", ""),
                "action_taken": "forwarded" if forwarded else "notified",
            }).execute()
        except Exception as e:
            # Ignore duplicate insert errors
            if "duplicate" not in str(e).lower():
                logger.warning("Failed to record processed message: %s", e)

    # Update history_id
    if new_history_id:
        supabase_admin.table("gmail_connections").update({
            "history_id": new_history_id,
        }).eq("id", connection["id"]).execute()

    return {
        "connection_id": connection["id"],
        "emails_found": len(emails),
        "matched_filters": len(filtered),
        "forwarded_to_openclaw": forwarded,
    }


# ── Connection Management ───────────────────────────────────────────────────


async def create_connection(user_id: str, code: str) -> dict:
    """
    Complete OAuth flow: exchange code, get user email, store connection, start watch.
    """
    # Exchange code for tokens
    tokens = await exchange_code_for_tokens(code)
    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)

    if not refresh_token:
        raise ValueError("No refresh token received. Make sure to use prompt=consent.")

    # Get user's Gmail address
    email_address = await get_gmail_user_email(access_token)
    logger.info("Gmail OAuth complete for user %s, email %s", user_id, email_address)

    # Check if connection already exists for this email
    existing = (
        supabase_admin.table("gmail_connections")
        .select("id")
        .eq("user_id", user_id)
        .eq("email_address", email_address)
        .execute()
    )
    if existing.data:
        # Update existing connection with new tokens
        conn_id = existing.data[0]["id"]
        supabase_admin.table("gmail_connections").update({
            "refresh_token": refresh_token,
            "access_token": access_token,
            "token_expires_at": (
                datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            ).isoformat(),
            "is_active": True,
        }).eq("id", conn_id).execute()

        conn = supabase_admin.table("gmail_connections").select("*").eq("id", conn_id).single().execute()
        connection = conn.data
    else:
        # Insert new connection
        result = supabase_admin.table("gmail_connections").insert({
            "user_id": user_id,
            "email_address": email_address,
            "refresh_token": refresh_token,
            "access_token": access_token,
            "token_expires_at": (
                datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            ).isoformat(),
        }).execute()

        if not result.data:
            raise ValueError("Failed to store Gmail connection")
        connection = result.data[0]

    # Start Gmail watch
    try:
        start_gmail_watch(connection)
    except Exception as e:
        logger.error("Failed to start Gmail watch (connection saved, watch can be retried): %s", e)

    return connection


def get_connections(user_id: str) -> list[dict]:
    """Get all Gmail connections for a user."""
    result = (
        supabase_admin.table("gmail_connections")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def delete_connection(connection_id: str, user_id: str) -> bool:
    """Disconnect Gmail — stop watch and remove connection."""
    conn = (
        supabase_admin.table("gmail_connections")
        .select("*")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conn.data:
        return False

    # Stop the watch
    stop_gmail_watch(conn.data)

    # Delete the connection
    supabase_admin.table("gmail_connections").delete().eq("id", connection_id).execute()
    return True
