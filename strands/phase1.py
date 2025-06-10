"""Phase 1 - Preference detailing logic."""
from typing import List
from models import Preference

class PreferenceDetailAgent:
    """Echoes back preferences for now."""

    def run(self, preferences: List[Preference]) -> List[Preference]:
        # In a real implementation, this would refine the preferences.
        return preferences
