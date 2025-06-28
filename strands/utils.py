import os


def llm_available() -> bool:
    """Return True if OPENAI_API_KEY is set."""
    api_key = os.getenv("OPENAI_API_KEY")
    return bool(api_key)

