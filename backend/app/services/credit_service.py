"""
Credit management service — handles balance checks, deductions, and top-ups.

Credit costs per model:
  - Claude (Anthropic) = 2 credits per message
  - GPT-4o  (OpenAI)   = 1 credit per message
  - Gemini  (Google)    = 1 credit per message

New users start with 50 free credits (created via DB trigger on user insert).
"""

import logging
from datetime import datetime, timezone
from typing import Any

from app.database import supabase_admin

logger = logging.getLogger(__name__)

# Cost table: credits consumed per AI message by model family
MODEL_CREDIT_COST: dict[str, int] = {
    "anthropic": 2,
    "openai": 1,
    "gemini": 1,
}

# Credit packs available for purchase
CREDIT_PACKS: dict[str, dict[str, Any]] = {
    "starter": {
        "name": "Starter Pack",
        "credits": 500,
        "price_cents": 900,     # $9
        "description": "500 credits — great for getting started",
    },
    "pro": {
        "name": "Pro Pack",
        "credits": 2000,
        "price_cents": 2900,    # $29
        "description": "2,000 credits — best value for regular use",
    },
    "business": {
        "name": "Business Pack",
        "credits": 6000,
        "price_cents": 7900,    # $79
        "description": "6,000 credits — for heavy usage & teams",
    },
}


def _detect_model_family(ai_model: str) -> str:
    """Detect model family from a model identifier string."""
    ai_lower = ai_model.lower()
    if "anthropic" in ai_lower or "claude" in ai_lower:
        return "anthropic"
    elif "openai" in ai_lower or "gpt" in ai_lower:
        return "openai"
    elif "gemini" in ai_lower or "google" in ai_lower:
        return "gemini"
    return "openai"  # default fallback


def get_credit_cost(ai_model: str) -> int:
    """Return the credit cost for a single message with the given model."""
    family = _detect_model_family(ai_model)
    return MODEL_CREDIT_COST.get(family, 1)


# ── Balance operations ───────────────────────────────────────────────────────


def get_balance(user_id: str) -> dict[str, Any]:
    """Get user's current credit balance. Creates a row if missing."""
    result = (
        supabase_admin.table("credit_balances")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    if result.data:
        return result.data[0]

    # Auto-create for existing users who don't have a balance row yet
    insert = (
        supabase_admin.table("credit_balances")
        .insert({
            "user_id": user_id,
            "balance": 50,
            "total_purchased": 0,
            "total_used": 0,
        })
        .execute()
    )
    # Also log the free signup transaction
    supabase_admin.table("credit_transactions").insert({
        "user_id": user_id,
        "amount": 50,
        "balance_after": 50,
        "type": "free_signup",
        "description": "Welcome bonus: 50 free credits",
    }).execute()

    return insert.data[0] if insert.data else {"user_id": user_id, "balance": 50, "total_purchased": 0, "total_used": 0}


def has_enough_credits(user_id: str, ai_model: str) -> bool:
    """Check if user has enough credits for one message with the given model."""
    cost = get_credit_cost(ai_model)
    balance_row = get_balance(user_id)
    return balance_row["balance"] >= cost


def deduct_credits(user_id: str, ai_model: str, tenant_id: str | None = None) -> dict[str, Any]:
    """
    Deduct credits for one AI message.
    Returns the updated balance info or raises ValueError if insufficient.
    """
    cost = get_credit_cost(ai_model)
    balance_row = get_balance(user_id)
    current = balance_row["balance"]

    if current < cost:
        raise ValueError(
            f"Insufficient credits: have {current}, need {cost}. "
            f"Purchase more at your dashboard."
        )

    new_balance = current - cost

    # Update balance
    supabase_admin.table("credit_balances").update({
        "balance": new_balance,
        "total_used": balance_row["total_used"] + cost,
    }).eq("user_id", user_id).execute()

    # Log transaction
    supabase_admin.table("credit_transactions").insert({
        "user_id": user_id,
        "amount": -cost,
        "balance_after": new_balance,
        "type": "usage",
        "description": f"AI message ({ai_model}) — {cost} credit(s)",
        "tenant_id": tenant_id,
    }).execute()

    logger.info(
        "Deducted %d credit(s) from user %s (model=%s). Balance: %d → %d",
        cost, user_id, ai_model, current, new_balance,
    )

    return {"balance": new_balance, "credits_deducted": cost, "model": ai_model}


def add_credits(
    user_id: str,
    amount: int,
    tx_type: str = "purchase",
    description: str = "",
    stripe_session_id: str | None = None,
) -> dict[str, Any]:
    """
    Add credits to a user's balance (after Stripe payment, admin grant, etc.).
    Returns the updated balance info.
    """
    balance_row = get_balance(user_id)
    current = balance_row["balance"]
    new_balance = current + amount

    # Update balance
    supabase_admin.table("credit_balances").update({
        "balance": new_balance,
        "total_purchased": balance_row["total_purchased"] + (amount if tx_type == "purchase" else 0),
    }).eq("user_id", user_id).execute()

    # Log transaction
    tx_data: dict[str, Any] = {
        "user_id": user_id,
        "amount": amount,
        "balance_after": new_balance,
        "type": tx_type,
        "description": description or f"Added {amount} credits",
    }
    if stripe_session_id:
        tx_data["stripe_session_id"] = stripe_session_id

    supabase_admin.table("credit_transactions").insert(tx_data).execute()

    logger.info(
        "Added %d credits to user %s (%s). Balance: %d → %d",
        amount, user_id, tx_type, current, new_balance,
    )

    return {"balance": new_balance, "credits_added": amount}


def get_transactions(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """Get recent credit transactions for a user."""
    result = (
        supabase_admin.table("credit_transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []
