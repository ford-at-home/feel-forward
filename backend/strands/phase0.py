"""Phase 0 - Factor discovery logic."""
from typing import List
import json

from .utils import llm_available
import openai

from models import FactorCategory


class FactorDiscoveryAgent:
    """Generate decision factors for a topic."""

    def run(self, topic: str) -> List[FactorCategory]:
        """Return factor categories for the given topic."""
        if llm_available():
            prompt = (
                "List decision factors for the topic as JSON with format: "
                "{\"factors\": [{\"category\": str, \"items\": [str]}]}"
            )
            messages = [
                {"role": "user", "content": f"Topic: {topic}. {prompt}"}
            ]
            try:
                client = openai.OpenAI()
                resp = client.chat.completions.create(
                    model="gpt-3.5-turbo", messages=messages, timeout=10
                )
                text = resp.choices[0].message.content
                data = json.loads(text)
                return [FactorCategory(**d) for d in data["factors"]]
            except Exception:
                pass
        # Fallback example factors
        return [
            FactorCategory(
                category="Work Environment",
                items=[
                    "Remote work flexibility",
                    "Team culture",
                    "Office location",
                    "Work-life balance",
                ],
            ),
            FactorCategory(
                category="Compensation",
                items=[
                    "Base salary",
                    "Equity/stock options",
                    "Benefits package",
                    "Bonus structure",
                ],
            ),
            FactorCategory(
                category="Growth & Development",
                items=[
                    "Learning opportunities",
                    "Career advancement",
                    "Mentorship",
                    "Skill development",
                ],
            ),
        ]
