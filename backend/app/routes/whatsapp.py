from fastapi import APIRouter, HTTPException

from app.database import supabase_admin
from app.schemas import IncomingMessagePayload
from app.services.whatsapp_service import WhatsAppService
from app.wrappers import get_wrapper

router = APIRouter()


@router.post("/connect/{user_id}")
async def connect_whatsapp(user_id: str):
    """Start a Baileys session and return a QR code for the user to scan."""
    try:
        result = await WhatsAppService.start_session(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WhatsApp service error: {e}")


@router.get("/qr/{user_id}")
async def get_qr(user_id: str):
    """Poll for the latest QR code (frontend calls this every 2-3 seconds)."""
    try:
        result = await WhatsAppService.get_qr(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WhatsApp service error: {e}")


@router.get("/status/{user_id}")
async def get_status(user_id: str):
    """Check WhatsApp connection status for a user."""
    try:
        result = await WhatsAppService.get_status(user_id)

        # Sync status to Supabase
        if result.get("connected"):
            supabase_admin.table("whatsapp_sessions").upsert({
                "user_id": user_id,
                "phone_number": result.get("phone"),
                "connected": True,
                "last_seen": "now()",
            }).execute()

        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WhatsApp service error: {e}")


@router.post("/disconnect/{user_id}")
async def disconnect_whatsapp(user_id: str):
    """Disconnect WhatsApp and remove Baileys session."""
    try:
        result = await WhatsAppService.disconnect(user_id)

        # Update DB
        supabase_admin.table("whatsapp_sessions").upsert({
            "user_id": user_id,
            "connected": False,
        }).execute()

        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WhatsApp service error: {e}")


@router.post("/send/{user_id}")
async def send_message(user_id: str, to: str, text: str):
    """Send a WhatsApp message on behalf of a user."""
    try:
        result = await WhatsAppService.send_message(user_id, to, text)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WhatsApp service error: {e}")


@router.post("/incoming")
async def incoming_message(payload: IncomingMessagePayload):
    """
    Called by the Node.js WhatsApp service when a message arrives.
    Looks up the user's active bot, generates an AI reply, returns it.
    """
    user_id = payload.userId

    # 1. Find the user's active bot config
    bot_result = (
        supabase_admin.table("bots")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )

    if not bot_result.data:
        return {"reply": "⚠️ No active bot configured. Visit your Gravon dashboard to set one up."}

    bot = bot_result.data[0]

    # 2. Generate AI reply using the configured wrapper
    try:
        wrapper = get_wrapper(bot["ai_provider"])
        reply = await wrapper.chat(
            message=payload.text,
            model=bot["ai_model"],
            system_prompt=bot["system_prompt"],
        )
    except Exception as e:
        reply = f"⚠️ AI error: {e}"

    # 3. Log the message in chat_messages
    try:
        supabase_admin.table("chat_messages").insert({
            "user_id": user_id,
            "bot_id": bot["id"],
            "from_phone": payload.from_,
            "from_name": payload.pushName,
            "message_text": payload.text,
            "reply_text": reply,
        }).execute()
    except Exception:
        pass  # Don't fail the reply if logging fails

    return {"reply": reply}
