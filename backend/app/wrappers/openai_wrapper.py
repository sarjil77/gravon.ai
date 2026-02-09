from openai import AsyncOpenAI

from app.config import settings
from app.wrappers.base_wrapper import BaseWrapper


class OpenAIWrapper(BaseWrapper):
    """Wrapper for OpenAI's Chat Completions API (GPT-4o, GPT-4, etc.)."""

    DEFAULT_MODEL = "gpt-4o"

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def chat(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        self._validate_message(message)

        response = await self.client.chat.completions.create(
            model=model or self.DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def chat_stream(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        self._validate_message(message)

        stream = await self.client.chat.completions.create(
            model=model or self.DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
