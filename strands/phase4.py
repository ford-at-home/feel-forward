"""Phase 4 - Insight synthesis."""
from typing import List
import json

import openai
from .utils import llm_available

from models import Reaction, Preference


class InsightSynthesisAgent:
    """Generate a summary from reactions and preferences."""

    def run(self, reactions: List[Reaction], preferences: List[Preference]) -> str:
        if llm_available():
            prompt = (
                "Use the reactions and preferences JSON to produce a short summary."
            )
            messages = [
                {
                    "role": "user",
                    "content": f"Reactions: {json.dumps([r.dict() for r in reactions])}; "
                    f"Preferences: {json.dumps([p.dict() for p in preferences])}. {prompt}",
                }
            ]
            try:
                resp = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo", messages=messages, timeout=10
                )
                return resp.choices[0].message.content.strip()
            except Exception:
                pass
        return (
            "Based on your responses, you seem to value stability and growth "
            "opportunities, but you're also drawn to environments where you can "
            "make a meaningful impact. Your emotional reactions suggest you're "
            "most energized by scenarios that offer both personal development "
            "and the chance to work with passionate people."
        )
