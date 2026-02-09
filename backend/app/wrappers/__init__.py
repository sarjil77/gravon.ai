from app.wrappers.base_wrapper import BaseWrapper
from app.wrappers.openai_wrapper import OpenAIWrapper
from app.wrappers.anthropic_wrapper import AnthropicWrapper
from app.wrappers.gemini_wrapper import GeminiWrapper

_WRAPPERS: dict[str, type[BaseWrapper]] = {
    "openai": OpenAIWrapper,
    "anthropic": AnthropicWrapper,
    "gemini": GeminiWrapper,
}


def get_wrapper(provider: str) -> BaseWrapper:
    """Factory function to get the appropriate AI wrapper by provider name."""
    wrapper_cls = _WRAPPERS.get(provider.lower())
    if wrapper_cls is None:
        available = ", ".join(_WRAPPERS.keys())
        raise ValueError(f"Unknown provider '{provider}'. Available: {available}")
    return wrapper_cls()


__all__ = [
    "BaseWrapper",
    "OpenAIWrapper",
    "AnthropicWrapper",
    "GeminiWrapper",
    "get_wrapper",
]
