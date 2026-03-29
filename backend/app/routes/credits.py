"""
API routes for credits & Razorpay payments.

Endpoints:
    GET  /api/credits/balance          — Get user's credit balance
    GET  /api/credits/transactions     — Get transaction history
    GET  /api/credits/packs            — List available credit packs
    POST /api/credits/checkout         — Create a Razorpay order
    POST /api/credits/verify           — Verify client-side payment signature
    POST /api/credits/webhook          — Razorpay webhook (payment updates)
"""

import json
import logging
import time
from typing import Any

import razorpay
from fastapi import APIRouter, HTTPException, Request

from app.config import settings
from app.database import supabase_admin
from app.services.credit_service import (
    CREDIT_PACKS,
    add_credits,
    get_balance,
    get_transactions,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Keep this table name for backward compatibility with already-deployed databases.
PAYMENT_SESSIONS_TABLE = "stripe_sessions"


def _get_razorpay_client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status_code=503, detail="Razorpay is not configured yet")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


# ── Credit Balance & History ─────────────────────────────────────────────────


@router.get("/balance")
async def credit_balance(user_id: str):
    """Get the current credit balance for a user."""
    try:
        bal = get_balance(user_id)
        return {
            "balance": bal["balance"],
            "total_purchased": bal["total_purchased"],
            "total_used": bal["total_used"],
        }
    except Exception as e:
        logger.error("Failed to get balance for %s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Failed to retrieve balance")


@router.get("/transactions")
async def credit_transactions(user_id: str, limit: int = 50):
    """Get recent credit transactions."""
    try:
        txns = get_transactions(user_id, limit=limit)
        return {"transactions": txns}
    except Exception as e:
        logger.error("Failed to get transactions for %s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Failed to retrieve transactions")


@router.get("/packs")
async def list_packs():
    """List available credit packs with pricing."""
    packs = [
        {
            "id": pack_id,
            "name": pack["name"],
            "credits": pack["credits"],
            "price_cents": pack["price_cents"],
            "price_display": f"\u20b9{pack['price_cents'] / 100:.0f}",
            "description": pack["description"],
        }
        for pack_id, pack in CREDIT_PACKS.items()
    ]
    return {"packs": packs}


# ── Razorpay Checkout ────────────────────────────────────────────────────────


@router.post("/checkout")
async def create_checkout(user_id: str, pack_id: str, success_url: str = "", cancel_url: str = ""):
    """
    Create a Razorpay order for purchasing credits.

        Query params:
            - user_id:     the user buying credits
            - pack_id:     one of 'starter', 'pro', 'business'
            - success_url: optional frontend success URL (kept for compatibility)
            - cancel_url:  optional frontend cancel URL (kept for compatibility)
        """
    client = _get_razorpay_client()

    pack = CREDIT_PACKS.get(pack_id)
    if not pack:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid pack_id '{pack_id}'. Available: {list(CREDIT_PACKS.keys())}",
        )

    # Keep compatibility params available for frontend flows if needed.
    if not success_url:
        success_url = "http://localhost:8080/dashboard?payment=success"
    if not cancel_url:
        cancel_url = "http://localhost:8080/dashboard?payment=cancelled"

    amount_minor_units = int(pack["price_cents"])
    receipt = f"credits_{user_id[:8]}_{int(time.time())}"

    try:
        order = client.order.create({
            "amount": amount_minor_units,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "user_id": user_id,
                "pack_id": pack_id,
                "credits": str(pack["credits"]),
                "success_url": success_url,
                "cancel_url": cancel_url,
            },
        })

        # Save order to DB for tracking. Table name is legacy for compatibility.
        supabase_admin.table(PAYMENT_SESSIONS_TABLE).insert({
            "id": order["id"],
            "user_id": user_id,
            "pack_id": pack_id,
            "credits": pack["credits"],
            "amount_cents": amount_minor_units,
            "currency": "INR",
            "status": "pending",
        }).execute()

        logger.info(
            "Razorpay order created: order=%s user=%s pack=%s credits=%d",
            order["id"], user_id, pack_id, pack["credits"],
        )

        return {
            "key_id": settings.razorpay_key_id,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "checkout_url": "",
            "session_id": order["id"],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "pack": {
                "id": pack_id,
                "name": pack["name"],
                "credits": pack["credits"],
            },
        }

    except Exception as e:
        logger.error("Razorpay error: %s", e)
        raise HTTPException(status_code=502, detail=f"Razorpay error: {str(e)}")


@router.post("/verify")
async def verify_checkout(
    user_id: str,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    """Verify Razorpay signature from frontend and grant credits idempotently."""
    client = _get_razorpay_client()

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })
    except Exception:
        logger.warning("Razorpay signature verification failed for order=%s", razorpay_order_id)
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    existing = (
        supabase_admin.table(PAYMENT_SESSIONS_TABLE)
        .select("id,user_id,pack_id,credits,status")
        .eq("id", razorpay_order_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Payment order not found")

    session = existing.data[0]
    if session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Payment order does not belong to user")

    if session.get("status") == "completed":
        return {"status": "already_processed", "order_id": razorpay_order_id}

    credits = int(session.get("credits", 0))
    if credits <= 0:
        raise HTTPException(status_code=400, detail="Invalid credits for payment order")

    pack_id = session.get("pack_id")
    pack = CREDIT_PACKS.get(pack_id, {})
    description = f"Purchased {pack.get('name', pack_id)}: {credits} credits"
    add_credits(
        user_id=user_id,
        amount=credits,
        tx_type="purchase",
        description=description,
        payment_session_id=razorpay_order_id,
    )

    supabase_admin.table(PAYMENT_SESSIONS_TABLE).update({
        "status": "completed",
        "stripe_payment_intent": razorpay_payment_id,
        "completed_at": "now()",
    }).eq("id", razorpay_order_id).execute()

    logger.info(
        "Razorpay payment verified and credits added: user=%s order=%s payment=%s credits=%d",
        user_id,
        razorpay_order_id,
        razorpay_payment_id,
        credits,
    )
    return {"status": "success", "order_id": razorpay_order_id}


# ── Razorpay Webhook ─────────────────────────────────────────────────────────


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """
    Handle Razorpay webhook events.
    """
    _get_razorpay_client()

    payload = await request.body()
    sig_header = request.headers.get("x-razorpay-signature", "")

    if settings.razorpay_webhook_secret:
        try:
            razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret)).utility.verify_webhook_signature(
                payload.decode("utf-8"), sig_header, settings.razorpay_webhook_secret
            )
        except Exception:
            logger.warning("Razorpay webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    try:
        event = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    event_type = event.get("event", "")
    logger.info("Razorpay webhook received: %s", event_type)

    if event_type in {"payment.captured", "order.paid"}:
        _handle_payment_completed(event)
    elif event_type in {"payment.failed", "order.failed"}:
        _handle_payment_failed(event)
    else:
        logger.info("Unhandled Razorpay event type: %s", event_type)

    return {"received": True}


def _extract_payment_entities(event: dict[str, Any]) -> tuple[str | None, str | None]:
    payload = event.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    order_entity = payload.get("order", {}).get("entity", {})
    order_id = payment_entity.get("order_id") or order_entity.get("id")
    payment_id = payment_entity.get("id")
    return order_id, payment_id


def _handle_payment_completed(event: dict[str, Any]) -> None:
    """Process successful payment events idempotently."""
    order_id, payment_id = _extract_payment_entities(event)
    if not order_id:
        logger.warning("Razorpay completion event missing order id")
        return

    existing = (
        supabase_admin.table(PAYMENT_SESSIONS_TABLE)
        .select("user_id,pack_id,credits,status")
        .eq("id", order_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        logger.warning("Razorpay completion event for unknown order %s", order_id)
        return

    session = existing.data[0]
    if session.get("status") == "completed":
        logger.info("Order %s already processed, skipping", order_id)
        return

    user_id = session.get("user_id")
    credits = int(session.get("credits", 0))
    pack_id = session.get("pack_id")
    if not user_id or credits <= 0:
        logger.warning("Razorpay session has invalid data: %s", session)
        return

    pack = CREDIT_PACKS.get(pack_id, {})
    description = f"Purchased {pack.get('name', pack_id)}: {credits} credits"
    add_credits(
        user_id=user_id,
        amount=credits,
        tx_type="purchase",
        description=description,
        payment_session_id=order_id,
    )

    supabase_admin.table(PAYMENT_SESSIONS_TABLE).update({
        "status": "completed",
        "stripe_payment_intent": payment_id,
        "completed_at": "now()",
    }).eq("id", order_id).execute()

    logger.info(
        "Credits added via webhook: user=%s pack=%s credits=%d order=%s",
        user_id,
        pack_id,
        credits,
        order_id,
    )


def _handle_payment_failed(event: dict[str, Any]) -> None:
    """Mark failed payment/order events."""
    order_id, _ = _extract_payment_entities(event)
    if not order_id:
        return
    supabase_admin.table(PAYMENT_SESSIONS_TABLE).update({
        "status": "failed",
    }).eq("id", order_id).execute()
    logger.info("Razorpay payment/order failed: %s", order_id)
