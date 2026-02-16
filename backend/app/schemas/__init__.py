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


# ── Tenant Schemas (Telegram bot provisioning) ────────────────────────────

class TenantCreateRequest(BaseModel):
    bot_token: str = Field(min_length=10, description="Telegram bot token from @BotFather")
    ai_model: str = Field(
        default="anthropic/claude-sonnet-4-20250514",
        description="AI model identifier",
    )
    api_key: str | None = Field(default=None, description="User-supplied AI provider API key (overrides server default)")
    channel: str = Field(default="telegram", pattern="^(telegram|discord|whatsapp)$")


class TenantResponse(BaseModel):
    id: str
    user_id: str
    bot_token: str
    bot_username: str | None = None
    ai_model: str
    channel: str
    container_id: str | None = None
    status: str
    credits_used: int
    credits_limit: int
    plan: str
    error_message: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TenantActionResponse(BaseModel):
    tenant_id: str
    action: str
    success: bool
    message: str


class UsageLogResponse(BaseModel):
    id: str
    tenant_id: str
    msg_count: int
    tokens_used: int
    logged_at: datetime | None = None


# ── Credit & Payment Schemas ──────────────────────────────────────────────

class CreditBalanceResponse(BaseModel):
    balance: int
    total_purchased: int
    total_used: int


class CreditTransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: int
    balance_after: int
    type: str
    description: str | None = None
    stripe_session_id: str | None = None
    tenant_id: str | None = None
    created_at: datetime | None = None


class CreditPackResponse(BaseModel):
    id: str
    name: str
    credits: int
    price_cents: int
    price_display: str
    description: str


class CheckoutRequest(BaseModel):
    pack_id: str = Field(description="Credit pack ID: 'starter', 'pro', or 'business'")
    success_url: str = Field(default="", description="URL to redirect after successful payment")
    cancel_url: str = Field(default="", description="URL to redirect on cancel")


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


# ── Gmail Schemas ─────────────────────────────────────────────────────────

class GmailConnectResponse(BaseModel):
    auth_url: str


class GmailFilters(BaseModel):
    from_addresses: list[str] = Field(default_factory=list, description="Only process emails from these addresses/domains")
    subject_contains: list[str] = Field(default_factory=list, description="Only process emails whose subject contains these keywords")
    has_attachment: bool | None = Field(default=None, description="Filter by attachment presence")


class GmailConnectionResponse(BaseModel):
    id: str
    user_id: str
    tenant_id: str | None = None
    email_address: str
    filters: dict = {}
    is_active: bool = True
    watch_expiry: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class GmailUpdateFiltersRequest(BaseModel):
    filters: GmailFilters
    tenant_id: str | None = Field(default=None, description="Link to a Telegram bot tenant for delivering alerts")


class GmailProcessedMessageResponse(BaseModel):
    id: str
    gmail_message_id: str
    from_address: str | None = None
    subject: str | None = None
    action_taken: str = "notified"
    processed_at: datetime | None = None
