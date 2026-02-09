import httpx

from app.config import settings


class WhatsAppService:
    """Proxy to the Node.js Baileys WhatsApp service."""

    BASE = settings.whatsapp_service_url

    @staticmethod
    async def start_session(user_id: str) -> dict:
        """Tell the Node service to start a Baileys session and return QR."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(f"{WhatsAppService.BASE}/session/{user_id}/start")
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    async def get_qr(user_id: str) -> dict:
        """Fetch the latest QR code data-URI for a user."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{WhatsAppService.BASE}/session/{user_id}/qr")
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    async def get_status(user_id: str) -> dict:
        """Get connection status for a user's WhatsApp session."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{WhatsAppService.BASE}/session/{user_id}/status")
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    async def disconnect(user_id: str) -> dict:
        """Disconnect and remove a user's WhatsApp session."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{WhatsAppService.BASE}/session/{user_id}/disconnect")
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    async def send_message(user_id: str, to: str, text: str) -> dict:
        """Send a WhatsApp message on behalf of a user."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{WhatsAppService.BASE}/session/{user_id}/send",
                json={"to": to, "text": text},
            )
            resp.raise_for_status()
            return resp.json()
