"""Phase 3 - Reaction logging."""
from typing import List
import json

import openai
from .utils import llm_available

from models import Reaction


class EmotionalReactionAgent:
    """Store or process user reactions."""

    def __init__(self):
        self._store: List[Reaction] = []

    def run(self, reaction: Reaction) -> str:
        self._store.append(reaction)
        if llm_available():
            try:
                messages = [
                    {
                        "role": "user",
                        "content": (
                            "Acknowledge the following reaction JSON: "
                            f"{reaction.json()}"
                        ),
                    }
                ]
                openai.ChatCompletion.create(
                    model="gpt-3.5-turbo", messages=messages, timeout=5
                )
            except Exception:
                pass
        return "success"
