import google.generativeai as genai

from app.config import settings
from app.wrappers.base_wrapper import BaseWrapper


class GeminiWrapper(BaseWrapper):
    """Wrapper for Google's Gemini API."""

    DEFAULT_MODEL = "gemini-2.0-flash"

    def __init__(self):
        genai.configure(api_key=settings.google_api_key)

    async def chat(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        self._validate_message(message)

        gen_model = genai.GenerativeModel(
            model_name=model or self.DEFAULT_MODEL,
            system_instruction=system_prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        response = await gen_model.generate_content_async(message)
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

        gen_model = genai.GenerativeModel(
            model_name=model or self.DEFAULT_MODEL,
            system_instruction=system_prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        response = await gen_model.generate_content_async(message, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text
