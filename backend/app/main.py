from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, bots, whatsapp

app = FastAPI(
    title="Clavio AI",
    description="No-code WhatsApp AI Assistant Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(bots.router, prefix="/api/bots", tags=["Bots"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "clavio-ai"}
