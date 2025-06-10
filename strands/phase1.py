"""Phase 1 - Preference detailing logic."""
from typing import List
import os
import json

import openai
from models import Preference

class PreferenceDetailAgent:
    """Refine preferences via LLM or echo if unavailable."""

    def run(self, preferences: List[Preference]) -> List[Preference]:
        if os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.environ["OPENAI_API_KEY"]
            try:
                messages = [
                    {
                        "role": "user",
                        "content": (
                            "Return these preferences as JSON without modification: "
                            f"{[p.dict() for p in preferences]}"
                        ),
                    }
                ]
                resp = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo", messages=messages, timeout=10
                )
                # Expect LLM to echo JSON
                data = json.loads(resp.choices[0].message.content)
                return [Preference(**p) for p in data]
            except Exception:
                pass
        return preferences
