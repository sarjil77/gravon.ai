from google import genai

from app.config import settings
from app.wrappers.base_wrapper import BaseWrapper


class GeminiWrapper(BaseWrapper):
    """Wrapper for Google Gemini (via google-genai SDK)."""

    DEFAULT_MODEL = "gemini-2.0-flash"

    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)

    async def chat(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        self._validate_message(message)

        response = await self.client.aio.models.generate_content(
            model=model or self.DEFAULT_MODEL,
            contents=message,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text

    async def chat_stream(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        self._validate_message(message)

        async for chunk in await self.client.aio.models.generate_content_stream(
            model=model or self.DEFAULT_MODEL,
            contents=message,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        ):
            if chunk.text:
                yield chunk.text
