"""Phase 4 - Insight synthesis."""
from typing import List
from models import Reaction

class InsightSynthesisAgent:
    """Generates a simple summary from reactions."""

    def run(self, reactions: List[Reaction]) -> str:
        if not reactions:
            return "No reactions provided."
        positive = sum(1 for r in reactions if r.excitement > r.anxiety)
        negative = len(reactions) - positive
        return f"You responded positively to {positive} scenarios and negatively to {negative}."
