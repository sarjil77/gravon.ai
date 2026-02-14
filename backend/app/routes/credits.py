"""
API routes for credits & Stripe payments.

Endpoints:
  GET  /api/credits/balance          — Get user's credit balance
  GET  /api/credits/transactions     — Get transaction history
  GET  /api/credits/packs            — List available credit packs
  POST /api/credits/checkout         — Create a Stripe checkout session
  POST /api/credits/webhook          — Stripe webhook (payment confirmation)
"""

import logging

import stripe
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
            "price_display": f"${pack['price_cents'] / 100:.0f}",
            "description": pack["description"],
        }
        for pack_id, pack in CREDIT_PACKS.items()
    ]
    return {"packs": packs}


# ── Stripe Checkout ──────────────────────────────────────────────────────────


@router.post("/checkout")
async def create_checkout(user_id: str, pack_id: str, success_url: str = "", cancel_url: str = ""):
    """
    Create a Stripe Checkout session for purchasing credits.

    Query params:
      - user_id:     the user buying credits
      - pack_id:     one of 'starter', 'pro', 'business'
      - success_url: where to redirect after payment (optional)
      - cancel_url:  where to redirect on cancel (optional)
    """
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe is not configured yet")

    pack = CREDIT_PACKS.get(pack_id)
    if not pack:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid pack_id '{pack_id}'. Available: {list(CREDIT_PACKS.keys())}",
        )

    stripe.api_key = settings.stripe_secret_key

    # Default URLs if not provided
    if not success_url:
        success_url = "http://localhost:8080/dashboard?payment=success"
    if not cancel_url:
        cancel_url = "http://localhost:8080/dashboard?payment=cancelled"

    try:
        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": pack["name"],
                            "description": pack["description"],
                        },
                        "unit_amount": pack["price_cents"],
                    },
                    "quantity": 1,
                }
            ],
            metadata={
                "user_id": user_id,
                "pack_id": pack_id,
                "credits": str(pack["credits"]),
            },
            success_url=success_url + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
        )

        # Save session to DB for tracking
        supabase_admin.table("stripe_sessions").insert({
            "id": session.id,
            "user_id": user_id,
            "pack_id": pack_id,
            "credits": pack["credits"],
            "amount_cents": pack["price_cents"],
            "status": "pending",
        }).execute()

        logger.info(
            "Stripe checkout created: session=%s user=%s pack=%s credits=%d",
            session.id, user_id, pack_id, pack["credits"],
        )

        return {
            "checkout_url": session.url,
            "session_id": session.id,
        }

    except stripe.StripeError as e:
        logger.error("Stripe error: %s", e)
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


# ── Stripe Webhook ───────────────────────────────────────────────────────────


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    Called by Stripe when payment is completed, expired, etc.
    """
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify webhook signature if webhook secret is configured
    if settings.stripe_webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except stripe.SignatureVerificationError:
            logger.warning("Stripe webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            logger.error("Stripe webhook error: %s", e)
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # In development without webhook secret, parse the event directly
        import json
        event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)

    # Handle the event
    event_type = event.type
    logger.info("Stripe webhook received: %s", event_type)

    if event_type == "checkout.session.completed":
        session = event.data.object
        _handle_checkout_completed(session)
    elif event_type == "checkout.session.expired":
        session = event.data.object
        _handle_checkout_expired(session)
    else:
        logger.info("Unhandled Stripe event type: %s", event_type)

    return {"received": True}


def _handle_checkout_completed(session) -> None:
    """Process a successful checkout — add credits to user."""
    session_id = session.id
    metadata = session.metadata or {}
    user_id = metadata.get("user_id")
    pack_id = metadata.get("pack_id")
    credits = int(metadata.get("credits", 0))

    if not user_id or not credits:
        logger.error("Checkout completed but missing metadata: %s", metadata)
        return

    # Check if already processed (idempotency)
    existing = (
        supabase_admin.table("stripe_sessions")
        .select("status")
        .eq("id", session_id)
        .execute()
    )
    if existing.data and existing.data[0].get("status") == "completed":
        logger.info("Session %s already processed, skipping", session_id)
        return

    # Add credits
    pack = CREDIT_PACKS.get(pack_id, {})
    description = f"Purchased {pack.get('name', pack_id)}: {credits} credits"
    add_credits(
        user_id=user_id,
        amount=credits,
        tx_type="purchase",
        description=description,
        stripe_session_id=session_id,
    )

    # Update session status
    supabase_admin.table("stripe_sessions").update({
        "status": "completed",
        "stripe_payment_intent": getattr(session, "payment_intent", None),
        "completed_at": "now()",
    }).eq("id", session_id).execute()

    logger.info(
        "Credits added: user=%s pack=%s credits=%d session=%s",
        user_id, pack_id, credits, session_id,
    )


def _handle_checkout_expired(session) -> None:
    """Mark an expired checkout session."""
    supabase_admin.table("stripe_sessions").update({
        "status": "expired",
    }).eq("id", session.id).execute()
    logger.info("Checkout session expired: %s", session.id)
