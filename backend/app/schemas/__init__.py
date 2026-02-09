from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


# ── Request Schemas (what the frontend sends) ──────────────────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: str = Field(min_length=1, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Bot Schemas ────────────────────────────────────────────────────────────

class BotCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""
    ai_provider: str = Field(default="openai", pattern="^(openai|anthropic|gemini)$")
    ai_model: str = "gpt-4o"
    system_prompt: str = "You are a helpful AI assistant for WhatsApp. Keep responses concise and friendly."


class BotUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
    system_prompt: str | None = None
    is_active: bool | None = None


class BotResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    ai_provider: str
    ai_model: str
    system_prompt: str
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ── WhatsApp Schemas ───────────────────────────────────────────────────────

class WhatsAppStatusResponse(BaseModel):
    connected: bool
    connecting: bool = False
    phone: str | None = None


class IncomingMessagePayload(BaseModel):
    userId: str
    from_: str = Field(alias="from")
    pushName: str = ""
    text: str
    messageId: str | None = None
    timestamp: int | None = None

    model_config = {"populate_by_name": True}


# ── Response Schemas (what the backend returns) ────────────────────────────

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    plan: str = "free"
    created_at: datetime | None = None


class AuthResponse(BaseModel):
    user: UserProfile
    access_token: str | None = None
    refresh_token: str | None = None
    message: str | None = None


class MessageResponse(BaseModel):
    message: str
