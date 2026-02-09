from anthropic import AsyncAnthropic

from app.config import settings
from app.wrappers.base_wrapper import BaseWrapper


class AnthropicWrapper(BaseWrapper):
    """Wrapper for Anthropic's Messages API (Claude 4, Sonnet, Haiku, etc.)."""

    DEFAULT_MODEL = "claude-sonnet-4-20250514"

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def chat(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        self._validate_message(message)

        response = await self.client.messages.create(
            model=model or self.DEFAULT_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": message}],
            temperature=temperature,
        )
        return response.content[0].text

    async def chat_stream(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        self._validate_message(message)

        async with self.client.messages.stream(
            model=model or self.DEFAULT_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": message}],
            temperature=temperature,
        ) as stream:
            async for text in stream.text_stream:
                yield text
