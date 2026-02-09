from fastapi import APIRouter, HTTPException

from app.database import supabase_admin
from app.schemas import BotCreateRequest, BotUpdateRequest, BotResponse
from app.wrappers import get_wrapper

router = APIRouter()


@router.get("/")
async def list_bots(user_id: str):
    """List all bots for a user."""
    result = supabase_admin.table("bots").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"bots": result.data}


@router.post("/", response_model=BotResponse)
async def create_bot(user_id: str, body: BotCreateRequest):
    """Create a new bot for a user."""
    result = supabase_admin.table("bots").insert({
        "user_id": user_id,
        "name": body.name,
        "description": body.description,
        "ai_provider": body.ai_provider,
        "ai_model": body.ai_model,
        "system_prompt": body.system_prompt,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create bot")

    return result.data[0]


@router.patch("/{bot_id}", response_model=BotResponse)
async def update_bot(bot_id: str, body: BotUpdateRequest):
    """Update a bot's configuration."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase_admin.table("bots").update(updates).eq("id", bot_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Bot not found")

    return result.data[0]


@router.delete("/{bot_id}")
async def delete_bot(bot_id: str):
    """Delete a bot."""
    result = supabase_admin.table("bots").delete().eq("id", bot_id).execute()
    return {"deleted": True}


@router.post("/{bot_id}/chat")
async def chat_with_bot(bot_id: str, message: str = ""):
    """Send a test message to a specific bot."""
    result = supabase_admin.table("bots").select("*").eq("id", bot_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Bot not found")

    bot = result.data
    wrapper = get_wrapper(bot["ai_provider"])
    response = await wrapper.chat(
        message=message,
        model=bot["ai_model"],
        system_prompt=bot["system_prompt"],
    )
    return {"response": response}
