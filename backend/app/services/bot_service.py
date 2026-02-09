from app.wrappers import get_wrapper


class BotService:
    """Business logic for managing AI bots and conversations."""

    @staticmethod
    async def get_response(
        provider: str,
        model: str,
        message: str,
        system_prompt: str = "You are a helpful AI assistant.",
    ) -> str:
        """Get a response from the specified AI provider."""
        wrapper = get_wrapper(provider)
        return await wrapper.chat(
            message=message,
            model=model,
            system_prompt=system_prompt,
        )
