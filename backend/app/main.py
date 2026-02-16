import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, bots, whatsapp, telegram, credits, gmail
from app.services.gmail_service import renew_all_watches

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def _gmail_watch_renewal_loop():
    """Background loop: renew Gmail watches every 6 hours."""
    while True:
        await asyncio.sleep(6 * 3600)  # 6 hours
        try:
            count = renew_all_watches()
            if count:
                logger.info("Renewed %d Gmail watches", count)
        except Exception as e:
            logger.error("Gmail watch renewal failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle events."""
    task = asyncio.create_task(_gmail_watch_renewal_loop())
    logger.info("Gmail watch renewal background task started")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Gravon AI",
    description="AI-powered bot platform with Telegram, WhatsApp & more",
    version="0.2.0",
    lifespan=lifespan,
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
app.include_router(gmail.router, prefix="/api/gmail", tags=["Gmail Integration"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Gravon-ai"}
