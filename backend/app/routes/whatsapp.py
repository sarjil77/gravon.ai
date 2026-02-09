from fastapi import APIRouter

router = APIRouter()


@router.post("/webhook")
async def whatsapp_webhook():
    """Receive incoming WhatsApp messages."""
    return {"message": "WhatsApp webhook - not yet implemented"}


@router.get("/status")
async def whatsapp_status():
    """Check WhatsApp connection status."""
    return {"connected": False, "message": "WhatsApp integration pending"}
