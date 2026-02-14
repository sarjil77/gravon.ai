from pathlib import Path

from pydantic_settings import BaseSettings

# Resolve .env path relative to the backend/ directory, not cwd
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # AI API Keys
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""

    # WhatsApp Service (Node.js Baileys)
    whatsapp_service_url: str = "http://localhost:3001"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_starter: str = ""   # Stripe Price ID for $9/mo
    stripe_price_pro: str = ""       # Stripe Price ID for $29/mo
    stripe_price_agency: str = ""    # Stripe Price ID for $99/mo

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8"}


settings = Settings()
