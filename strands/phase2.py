"""Phase 2 - Scenario generation."""
from typing import List
import json

import openai
from .utils import llm_available
from models import Preference, Scenario


class ScenarioBuilderAgent:
    """Generate scenarios from preferences and topic."""

    def run(self, preferences: List[Preference], topic: str) -> List[Scenario]:
        if llm_available():
            prefs_json = json.dumps([p.dict() for p in preferences])
            prompt = (
                "Using the following preferences JSON generate two scenarios as "
                "{\"scenarios\": [{\"id\": str, \"title\": str, \"text\": str}]}"
            )
            messages = [
                {
                    "role": "user",
                    "content": f"Topic: {topic}. Preferences: {prefs_json}. {prompt}",
                }
            ]
            try:
                resp = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo", messages=messages, timeout=10
                )
                data = json.loads(resp.choices[0].message.content)
                return [Scenario(**s) for s in data["scenarios"]]
            except Exception:
                pass
        return [
            Scenario(
                id="s1",
                title="The Startup Adventure",
                text=(
                    "You join a fast-growing startup where you wear many hats. "
                    "The equity potential is exciting, but the hours are long "
                    "and the stability uncertain. Your colleagues are passionate "
                    "and the culture is energetic."
                ),
            ),
            Scenario(
                id="s2",
                title="The Corporate Comfort",
                text=(
                    "You land a role at an established company with excellent "
                    "benefits and clear career progression. The work is "
                    "structured, the pay is reliable, but innovation moves "
                    "slowly and bureaucracy can be frustrating."
                ),
            ),
        ]
