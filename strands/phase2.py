"""Phase 2 - Scenario generation."""
from typing import List
import json
import uuid

import openai
from .utils import llm_available
from models import Preference, Scenario


class ScenarioBuilderAgent:
    """Generate scenarios that test user preferences and trade-offs."""

    def run(self, preferences: List[Preference], topic: str) -> List[Scenario]:
        if llm_available():
            return self._generate_llm_scenarios(preferences, topic)
        else:
            return self._generate_fallback_scenarios(preferences, topic)
    
    def _generate_llm_scenarios(self, preferences: List[Preference], topic: str) -> List[Scenario]:
        """Generate scenarios using LLM with sophisticated prompting."""
        try:
            # Create detailed context for the LLM
            pref_summary = self._create_preference_summary(preferences)
            
            system_prompt = """You are an expert scenario generator for decision-making. Create realistic scenarios that test the user's stated preferences through trade-offs and conflicts.

Generate exactly 5 scenarios that:
1. One "ideal" scenario that meets most high-importance preferences
2. Two scenarios that force trade-offs between important preferences
3. One scenario that challenges their stated limits/thresholds  
4. One "wildcard" scenario that's unexpected but relevant

Each scenario should:
- Be realistic and specific to the topic
- Create emotional tension through trade-offs
- Be 2-3 sentences that paint a vivid picture
- Have a compelling title

Return ONLY a JSON object with this exact structure:
{
  "scenarios": [
    {"id": "unique_id", "title": "Scenario Title", "text": "Detailed scenario description..."}
  ]
}"""

            user_content = f"""Topic: {topic}

User's detailed preferences:
{pref_summary}

Create 5 scenarios that will help reveal the user's true priorities through their emotional reactions."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
            
            client = openai.OpenAI()
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.8,
                timeout=30
            )
            
            data = json.loads(resp.choices[0].message.content)
            scenarios = []
            
            for s_data in data["scenarios"]:
                scenario = Scenario(
                    id=s_data.get("id", str(uuid.uuid4())[:8]),
                    title=s_data.get("title", "Untitled Scenario"),
                    text=s_data.get("text", "Description not available")
                )
                scenarios.append(scenario)
            
            return scenarios
            
        except Exception as e:
            # Fall back to rule-based generation
            return self._generate_fallback_scenarios(preferences, topic)
    
    def _create_preference_summary(self, preferences: List[Preference]) -> str:
        """Create a human-readable summary of preferences for the LLM."""
        summary = []
        
        # Sort by importance
        sorted_prefs = sorted(preferences, key=lambda p: p.importance, reverse=True)
        
        for pref in sorted_prefs:
            pref_line = f"- {pref.factor}: Importance {pref.importance}/10"
            if pref.hasLimit and pref.limit:
                pref_line += f" (Requirement: {pref.limit})"
            if pref.tradeoff:
                pref_line += f" (Trade-off consideration: {pref.tradeoff})"
            summary.append(pref_line)
        
        return "\n".join(summary)
    
    def _generate_fallback_scenarios(self, preferences: List[Preference], topic: str) -> List[Scenario]:
        """Generate scenarios without LLM using preference-based rules."""
        scenarios = []
        
        # Sort preferences by importance
        sorted_prefs = sorted(preferences, key=lambda p: p.importance, reverse=True)
        high_importance = [p for p in sorted_prefs if p.importance >= 8]
        medium_importance = [p for p in sorted_prefs if 5 <= p.importance < 8]
        
        # Scenario 1: Ideal (meets most high-importance preferences)
        scenarios.append(self._create_ideal_scenario(high_importance, topic))
        
        # Scenario 2: High-stakes trade-off
        if len(high_importance) >= 2:
            scenarios.append(self._create_tradeoff_scenario(high_importance, topic))
        
        # Scenario 3: Challenge limits
        limit_prefs = [p for p in preferences if p.hasLimit and p.limit]
        if limit_prefs:
            scenarios.append(self._create_challenge_scenario(limit_prefs, topic))
        
        # Scenario 4: Medium preference focus
        if medium_importance:
            scenarios.append(self._create_medium_focus_scenario(medium_importance, topic))
        
        # Scenario 5: Wildcard
        scenarios.append(self._create_wildcard_scenario(preferences, topic))
        
        return scenarios
    
    def _create_ideal_scenario(self, high_prefs: List[Preference], topic: str) -> Scenario:
        """Create a scenario that meets most high-importance preferences."""
        if "job" in topic.lower():
            return Scenario(
                id="ideal",
                title="The Dream Opportunity",
                text=f"You've found a role that checks most of your boxes: {', '.join([p.factor.lower() for p in high_prefs[:3]])} are all excellent. The company culture is supportive, the compensation is competitive, and there's clear growth potential. It feels almost too good to be true, but the offer is real and they want you to start soon."
            )
        else:
            return Scenario(
                id="ideal",
                title="Perfect Match",
                text=f"This option strongly delivers on your top priorities: {', '.join([p.factor.lower() for p in high_prefs[:3]])}. Everything seems to align with what you've said matters most, and you can easily envision yourself thriving in this situation."
            )
    
    def _create_tradeoff_scenario(self, high_prefs: List[Preference], topic: str) -> Scenario:
        """Create a scenario that forces trade-offs between important preferences."""
        pref1, pref2 = high_prefs[0], high_prefs[1]
        
        if "job" in topic.lower():
            return Scenario(
                id="tradeoff",
                title="The Difficult Choice",
                text=f"This role excels in {pref1.factor.lower()} - exactly what you wanted. However, the {pref2.factor.lower()} is significantly below your expectations. The hiring manager is honest about this limitation but emphasizes the strengths. You have to decide what matters more to your long-term happiness."
            )
        else:
            return Scenario(
                id="tradeoff", 
                title="Competing Priorities",
                text=f"This option delivers exceptionally on {pref1.factor.lower()} but falls short on {pref2.factor.lower()}. You can't have both, and the choice forces you to confront which factor truly drives your decision."
            )
    
    def _create_challenge_scenario(self, limit_prefs: List[Preference], topic: str) -> Scenario:
        """Create a scenario that tests stated limits."""
        pref = limit_prefs[0]
        
        return Scenario(
            id="challenge",
            title="Testing Your Limits", 
            text=f"Everything else about this opportunity is appealing, but the {pref.factor.lower()} doesn't meet your stated requirement of '{pref.limit}'. The decision maker acknowledges this but asks if you'd consider making an exception given the other strong points. How firm are your boundaries?"
        )
    
    def _create_medium_focus_scenario(self, medium_prefs: List[Preference], topic: str) -> Scenario:
        """Create a scenario focusing on medium-importance preferences."""
        focus_pref = medium_prefs[0]
        
        return Scenario(
            id="medium",
            title="The Unexpected Appeal",
            text=f"While this option is average on your top priorities, it surprisingly excels at {focus_pref.factor.lower()} in ways you hadn't fully considered. It makes you wonder if you've been focusing on the right factors, or if this 'nice-to-have' might actually matter more than you thought."
        )
    
    def _create_wildcard_scenario(self, preferences: List[Preference], topic: str) -> Scenario:
        """Create an unexpected but relevant scenario."""
        if "job" in topic.lower():
            return Scenario(
                id="wildcard",
                title="The Curveball Opportunity", 
                text="A completely different type of role has emerged - one you never considered but that people in your network are excited about. It doesn't match your stated preferences exactly, but it offers unique advantages that don't fit neatly into your original framework. Your gut reaction will tell you a lot about whether you've been thinking too narrowly."
            )
        else:
            return Scenario(
                id="wildcard",
                title="The Dark Horse Option",
                text="An unconventional choice has appeared that doesn't fit your original criteria but offers unique benefits you hadn't considered. It challenges your assumptions about what you need and might reveal preferences you didn't know you had."
            )
