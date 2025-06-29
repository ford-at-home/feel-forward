"""Phase 1 - Preference detailing logic."""
from typing import List, Optional
import json

import openai
from .utils import llm_available
from models import Preference

class PreferenceDetailAgent:
    """Interview user to detail and enrich their preferences."""

    def run(self, preferences: List[Preference], topic: Optional[str] = None) -> List[Preference]:
        """Enrich preferences with importance, limits, and trade-offs."""
        if not llm_available():
            return self._fallback_enrichment(preferences)
        
        try:
            # Create a comprehensive prompt for preference detailing
            system_prompt = """You are a preference detailing assistant helping users clarify their decision criteria.
            
For each preference, you should:
1. Assign an importance score (1-10) based on context
2. Determine if there should be limits/thresholds
3. Define specific limits if applicable
4. Identify potential trade-offs with other preferences

Return a JSON array of preferences with this exact structure:
[{
    "factor": "original factor name",
    "importance": 1-10,
    "hasLimit": true/false,
    "limit": "specific threshold or range if hasLimit is true, null otherwise",
    "tradeoff": "what they might sacrifice this for, or null"
}]"""

            user_content = f"""Topic: {topic or 'life decision'}
            
User's selected preferences:
{json.dumps([p.dict() for p in preferences], indent=2)}

For each preference above, enrich it with:
- Importance (1-10 scale)
- Whether it has limits/thresholds
- Specific limits (e.g., "minimum $80k", "max 45 min commute", "at least 3 days remote")
- Trade-offs (what might be sacrificed for this)

Consider the topic context when assigning importance and defining limits.
Return ONLY the JSON array."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
            
            client = openai.OpenAI()
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                timeout=30
            )
            
            # Parse the enriched preferences
            data = json.loads(resp.choices[0].message.content)
            enriched_prefs = []
            
            for pref_data in data:
                # Ensure we have all required fields
                enriched_pref = Preference(
                    factor=pref_data.get("factor", ""),
                    importance=pref_data.get("importance", 5),
                    hasLimit=pref_data.get("hasLimit", False),
                    limit=pref_data.get("limit"),
                    tradeoff=pref_data.get("tradeoff")
                )
                enriched_prefs.append(enriched_pref)
            
            return enriched_prefs
            
        except Exception as e:
            # If LLM fails, use fallback
            return self._fallback_enrichment(preferences)
    
    def _fallback_enrichment(self, preferences: List[Preference]) -> List[Preference]:
        """Provide basic enrichment when LLM is unavailable."""
        enriched = []
        
        # Common factors and their typical importance/limits
        factor_defaults = {
            # Work-related
            "salary": {"importance": 8, "hasLimit": True, "limit": "minimum $60k"},
            "remote work": {"importance": 7, "hasLimit": True, "limit": "at least 3 days remote"},
            "work-life balance": {"importance": 8, "hasLimit": True, "limit": "max 45 hours/week"},
            "team culture": {"importance": 7, "hasLimit": False},
            "career growth": {"importance": 6, "hasLimit": False},
            
            # Location-related
            "cost of living": {"importance": 8, "hasLimit": True, "limit": "max 30% of income on rent"},
            "commute time": {"importance": 7, "hasLimit": True, "limit": "max 45 minutes"},
            "weather": {"importance": 5, "hasLimit": False},
            "proximity to family": {"importance": 6, "hasLimit": True, "limit": "within 2 hour flight"},
            
            # Relationship-related
            "shared values": {"importance": 9, "hasLimit": False},
            "communication style": {"importance": 8, "hasLimit": False},
            "life goals alignment": {"importance": 9, "hasLimit": False},
            "physical attraction": {"importance": 6, "hasLimit": False},
        }
        
        for i, pref in enumerate(preferences):
            factor_lower = pref.factor.lower()
            
            # Look for matching defaults
            defaults = None
            for key, values in factor_defaults.items():
                if key in factor_lower:
                    defaults = values
                    break
            
            if defaults:
                enriched.append(Preference(
                    factor=pref.factor,
                    importance=defaults["importance"],
                    hasLimit=defaults["hasLimit"],
                    limit=defaults.get("limit"),
                    tradeoff=f"Might accept lower on other preferences"
                ))
            else:
                # Generic enrichment for unknown factors
                enriched.append(Preference(
                    factor=pref.factor,
                    importance=5 + (i % 3),  # Vary importance
                    hasLimit=i % 2 == 0,  # Alternate having limits
                    limit="Moderate preference" if i % 2 == 0 else None,
                    tradeoff="Flexible depending on overall fit"
                ))
        
        return enriched
