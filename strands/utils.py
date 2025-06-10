import os
import openai


def llm_available() -> bool:
    """Return True if OPENAI_API_KEY is set and configure openai."""
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        openai.api_key = api_key
        return True
    return False

