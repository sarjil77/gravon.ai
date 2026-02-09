from abc import ABC, abstractmethod


class BaseWrapper(ABC):
    """Abstract base class for all AI provider wrappers.

    All wrappers must implement `chat()` at minimum.
    This ensures you can swap providers without changing calling code.
    """

    @abstractmethod
    async def chat(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Send a message and return the AI's text response."""
        ...

    @abstractmethod
    async def chat_stream(
        self,
        message: str,
        model: str = "",
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        """Stream a chat response, yielding chunks of text."""
        ...

    def _validate_message(self, message: str) -> None:
        """Common validation for all wrappers."""
        if not message or not message.strip():
            raise ValueError("Message cannot be empty")
