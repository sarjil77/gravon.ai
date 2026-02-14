import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, bots, whatsapp, telegram, credits

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

app = FastAPI(
    title="Gravon AI",
    description="AI-powered bot platform with Telegram, WhatsApp & more",
    version="0.2.0",
)

# In production, Nginx handles CORS; allow all for dev flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(bots.router, prefix="/api/bots", tags=["Bots"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["Telegram"])
app.include_router(credits.router, prefix="/api/credits", tags=["Credits & Payments"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Gravon-ai"}
