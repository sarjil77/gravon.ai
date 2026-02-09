from fastapi import APIRouter

from app.wrappers import get_wrapper

router = APIRouter()


@router.get("/")
async def list_bots():
    """List all configured bots."""
    return {"bots": []}


@router.post("/chat")
async def chat(provider: str = "openai", model: str = "gpt-4o", message: str = ""):
    """Send a message to an AI bot and get a response."""
    wrapper = get_wrapper(provider)
    response = await wrapper.chat(message=message, model=model)
    return {"response": response}
