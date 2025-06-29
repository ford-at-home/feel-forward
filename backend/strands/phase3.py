"""Phase 3 - Emotional reaction processing and pattern detection."""
from typing import List, Optional
import json

import openai
from .utils import llm_available
from models import Reaction, Scenario


class EmotionalReactionAgent:
    """Process and analyze emotional reactions to scenarios."""

    def __init__(self):
        self._store: List[Reaction] = []

    def run(self, reaction: Reaction, scenario: Optional[Scenario] = None) -> str:
        """Process a reaction and provide emotional pattern insights."""
        self._store.append(reaction)
        
        if llm_available() and scenario:
            return self._analyze_reaction_with_llm(reaction, scenario)
        else:
            return self._analyze_reaction_fallback(reaction)
    
    def _analyze_reaction_with_llm(self, reaction: Reaction, scenario: Scenario) -> str:
        """Use LLM to analyze the emotional reaction in context."""
        try:
            system_prompt = """You are an emotional intelligence coach analyzing someone's gut reactions to decision scenarios.

Provide a brief (1-2 sentence) insight about what this emotional reaction reveals about their priorities and decision-making patterns. Focus on:
- What the intensity levels suggest about their true priorities
- Any contradictions between stated vs. felt preferences
- Patterns that might help them understand themselves better

Be empathetic but insightful."""

            user_content = f"""Scenario: "{scenario.title}"
Description: {scenario.text}

Emotional Response:
- Excitement level: {reaction.excitement}/10
- Anxiety level: {reaction.anxiety}/10
- Body sensation: {reaction.body}
- Thoughts: {reaction.freeform}

What does this reaction pattern reveal about their decision-making?"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
            
            client = openai.OpenAI()
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=150,
                timeout=10
            )
            
            return resp.choices[0].message.content.strip()
            
        except Exception:
            return self._analyze_reaction_fallback(reaction)
    
    def _analyze_reaction_fallback(self, reaction: Reaction) -> str:
        """Analyze reaction without LLM using pattern rules."""
        excitement_high = reaction.excitement >= 7
        anxiety_high = reaction.anxiety >= 7
        
        if excitement_high and not anxiety_high:
            return "Strong positive response - this scenario aligns well with your core values and desires."
        elif anxiety_high and not excitement_high:
            return "High anxiety suggests this scenario conflicts with important needs or boundaries."
        elif excitement_high and anxiety_high:
            return "Mixed emotions indicate a complex scenario that both attracts and concerns you - worth deeper exploration."
        elif reaction.excitement <= 3 and reaction.anxiety <= 3:
            return "Low emotional response suggests this scenario doesn't strongly connect with your priorities."
        else:
            return "Moderate reaction - this scenario is acceptable but doesn't strongly pull you in either direction."
    
    def get_all_reactions(self) -> List[Reaction]:
        """Get all stored reactions for analysis."""
        return self._store.copy()
    
    def get_reaction_patterns(self) -> dict:
        """Analyze patterns across all stored reactions."""
        if not self._store:
            return {}
        
        avg_excitement = sum(r.excitement for r in self._store) / len(self._store)
        avg_anxiety = sum(r.anxiety for r in self._store) / len(self._store)
        
        high_excitement_count = sum(1 for r in self._store if r.excitement >= 7)
        high_anxiety_count = sum(1 for r in self._store if r.anxiety >= 7)
        
        return {
            "avg_excitement": round(avg_excitement, 1),
            "avg_anxiety": round(avg_anxiety, 1),
            "high_excitement_scenarios": high_excitement_count,
            "high_anxiety_scenarios": high_anxiety_count,
            "total_reactions": len(self._store),
            "emotional_tendency": "positive" if avg_excitement > avg_anxiety else "cautious"
        }
