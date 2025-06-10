"""Phase 2 - Scenario generation."""
from typing import List
from models import Preference, Scenario

class ScenarioBuilderAgent:
    """Builds simple scenarios from preferences."""

    def run(self, preferences: List[Preference]) -> List[Scenario]:
        # Stub: return static scenarios
        scenarios = [
            Scenario(id="s1", title="Startup in the suburbs",
                     text="A 50-person startup 20 miles away offering stock options."),
            Scenario(id="s2", title="Corporate downtown",
                     text="A large corporation in the city center with a higher salary."),
        ]
        return scenarios
