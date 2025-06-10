"""Phase 0 - Factor discovery logic."""
from typing import List
from models import Factor

class FactorDiscoveryAgent:
    """Returns a list of common decision factors."""

    def run(self, topic: str) -> List[Factor]:
        # Minimal stub implementation based on PROMPTS.md
        base = [
            Factor(id="compensation", name="Compensation", category="Job"),
            Factor(id="team", name="Team culture", category="Work"),
            Factor(id="commute", name="Commute time", category="Logistics"),
            Factor(id="growth", name="Growth potential", category="Career"),
        ]
        return base
