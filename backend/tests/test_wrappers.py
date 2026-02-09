import pytest

from app.wrappers import get_wrapper
from app.wrappers.base_wrapper import BaseWrapper
from app.wrappers.openai_wrapper import OpenAIWrapper
from app.wrappers.anthropic_wrapper import AnthropicWrapper
from app.wrappers.gemini_wrapper import GeminiWrapper


def test_get_wrapper_openai():
    wrapper = get_wrapper("openai")
    assert isinstance(wrapper, OpenAIWrapper)
    assert isinstance(wrapper, BaseWrapper)


def test_get_wrapper_anthropic():
    wrapper = get_wrapper("anthropic")
    assert isinstance(wrapper, AnthropicWrapper)
    assert isinstance(wrapper, BaseWrapper)


def test_get_wrapper_gemini():
    wrapper = get_wrapper("gemini")
    assert isinstance(wrapper, GeminiWrapper)
    assert isinstance(wrapper, BaseWrapper)


def test_get_wrapper_case_insensitive():
    wrapper = get_wrapper("OpenAI")
    assert isinstance(wrapper, OpenAIWrapper)


def test_get_wrapper_unknown_raises():
    with pytest.raises(ValueError, match="Unknown provider"):
        get_wrapper("unknown-provider")


def test_validate_message_empty():
    wrapper = get_wrapper("openai")
    with pytest.raises(ValueError, match="Message cannot be empty"):
        wrapper._validate_message("")


def test_validate_message_whitespace():
    wrapper = get_wrapper("openai")
    with pytest.raises(ValueError, match="Message cannot be empty"):
        wrapper._validate_message("   ")
