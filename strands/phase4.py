"""Phase 4 - Deep insight synthesis and pattern recognition."""
from typing import List, Dict, Optional
import json

import openai
from .utils import llm_available
from models import Reaction, Preference, Scenario


class InsightSynthesisAgent:
    """Synthesize deep insights from the complete decision-making journey."""

    def run(self, reactions: List[Reaction], preferences: List[Preference], 
            scenarios: Optional[List[Scenario]] = None, topic: Optional[str] = None) -> str:
        """Generate comprehensive insights from all collected data."""
        if llm_available():
            return self._generate_llm_insights(reactions, preferences, scenarios, topic)
        else:
            return self._generate_fallback_insights(reactions, preferences)
    
    def _generate_llm_insights(self, reactions: List[Reaction], preferences: List[Preference],
                              scenarios: Optional[List[Scenario]], topic: Optional[str]) -> str:
        """Use LLM to generate sophisticated insights."""
        try:
            # Build comprehensive context
            analysis_data = self._build_analysis_context(reactions, preferences, scenarios)
            
            system_prompt = """You are an expert decision-making coach who helps people understand their true priorities through emotional pattern analysis.

Analyze the complete decision journey and provide insights that:
1. Reveal contradictions between stated and felt preferences
2. Identify emotional patterns that suggest hidden priorities
3. Highlight which factors truly drive their decision-making
4. Point out any blind spots or areas for deeper reflection
5. Offer 1-2 specific recommendations for how to approach this decision

Be insightful, empathetic, and actionable. Focus on self-awareness rather than prescriptive advice."""

            user_content = f"""Decision Topic: {topic or 'Important life choice'}

{analysis_data}

Provide deep insights about this person's decision-making patterns and what their emotional responses reveal about their true priorities."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
            
            client = openai.OpenAI()
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                timeout=15
            )
            
            return resp.choices[0].message.content.strip()
            
        except Exception:
            return self._generate_fallback_insights(reactions, preferences)
    
    def _build_analysis_context(self, reactions: List[Reaction], preferences: List[Preference],
                               scenarios: Optional[List[Scenario]]) -> str:
        """Build rich context for LLM analysis."""
        context_parts = []
        
        # Preference analysis
        high_importance = [p for p in preferences if p.importance >= 8]
        medium_importance = [p for p in preferences if 5 <= p.importance < 8]
        
        context_parts.append("STATED PREFERENCES:")
        context_parts.append(f"High Priority ({len(high_importance)} factors):")
        for pref in high_importance:
            limit_text = f" (Requirement: {pref.limit})" if pref.hasLimit and pref.limit else ""
            context_parts.append(f"  - {pref.factor}: {pref.importance}/10{limit_text}")
        
        if medium_importance:
            context_parts.append(f"\nMedium Priority ({len(medium_importance)} factors):")
            for pref in medium_importance:
                context_parts.append(f"  - {pref.factor}: {pref.importance}/10")
        
        # Emotional pattern analysis
        if reactions:
            avg_excitement = sum(r.excitement for r in reactions) / len(reactions)
            avg_anxiety = sum(r.anxiety for r in reactions) / len(reactions)
            
            high_excitement_reactions = [r for r in reactions if r.excitement >= 7]
            high_anxiety_reactions = [r for r in reactions if r.anxiety >= 7]
            
            context_parts.append(f"\nEMOTIONAL PATTERNS:")
            context_parts.append(f"Average excitement: {avg_excitement:.1f}/10")
            context_parts.append(f"Average anxiety: {avg_anxiety:.1f}/10")
            context_parts.append(f"High excitement scenarios: {len(high_excitement_reactions)}")
            context_parts.append(f"High anxiety scenarios: {len(high_anxiety_reactions)}")
            
            # Individual reaction details
            context_parts.append("\nREACTION DETAILS:")
            for i, reaction in enumerate(reactions):
                scenario_ref = f"Scenario {i+1}" if scenarios and i < len(scenarios) else f"Reaction {i+1}"
                context_parts.append(f"{scenario_ref}: Excitement {reaction.excitement}/10, Anxiety {reaction.anxiety}/10")
                if reaction.freeform:
                    context_parts.append(f"  Thoughts: {reaction.freeform}")
        
        return "\n".join(context_parts)
    
    def _generate_fallback_insights(self, reactions: List[Reaction], preferences: List[Preference]) -> str:
        """Generate insights without LLM using pattern analysis."""
        insights = []
        
        # Analyze stated vs felt priorities
        high_importance_prefs = [p for p in preferences if p.importance >= 8]
        
        if reactions:
            avg_excitement = sum(r.excitement for r in reactions) / len(reactions)
            avg_anxiety = sum(r.anxiety for r in reactions) / len(reactions)
            
            # Emotional tendency analysis
            if avg_excitement > 6:
                insights.append("Your emotional responses show strong engagement with these scenarios, suggesting you're excited about the possibilities ahead.")
            elif avg_anxiety > 6:
                insights.append("Your reactions reveal some anxiety about this decision, which may indicate you're concerned about making the wrong choice or that important needs aren't being met.")
            
            # Pattern recognition
            high_excitement_count = sum(1 for r in reactions if r.excitement >= 7)
            if high_excitement_count >= 2:
                insights.append("You had strong positive reactions to multiple scenarios, suggesting you're open to different paths as long as core needs are met.")
            
            # Preference-reaction alignment
            if high_importance_prefs:
                insights.append(f"Your top priorities appear to be {', '.join([p.factor.lower() for p in high_importance_prefs[:3]])}, and your emotional responses will help clarify which of these truly drives your satisfaction.")
        
        # Synthesis
        if reactions:
            avg_excitement = sum(r.excitement for r in reactions) / len(reactions)
            avg_anxiety = sum(r.anxiety for r in reactions) / len(reactions)
            
            if avg_excitement > avg_anxiety:
                insights.append("Overall, you seem optimistic about your options. Trust your positive reactions as they likely point toward choices that align with your authentic preferences.")
            else:
                insights.append("Your caution suggests this is a significant decision for you. Pay attention to what specifically triggers anxiety - those concerns may reveal important boundaries or unmet needs.")
        
        return " ".join(insights) if insights else "Based on your preferences and reactions, continue to pay attention to both your logical analysis and emotional responses as you move forward with this decision."
    
    def analyze_preference_reaction_alignment(self, reactions: List[Reaction], 
                                            preferences: List[Preference]) -> Dict[str, any]:
        """Analyze how emotional reactions align with stated preferences."""
        if not reactions or not preferences:
            return {}
        
        high_importance_prefs = [p for p in preferences if p.importance >= 8]
        avg_excitement = sum(r.excitement for r in reactions) / len(reactions)
        avg_anxiety = sum(r.anxiety for r in reactions) / len(reactions)
        
        return {
            "stated_high_priorities": len(high_importance_prefs),
            "avg_emotional_response": {
                "excitement": round(avg_excitement, 1),
                "anxiety": round(avg_anxiety, 1)
            },
            "emotional_tendency": "positive" if avg_excitement > avg_anxiety else "cautious",
            "engagement_level": "high" if avg_excitement > 6 or avg_anxiety > 6 else "moderate"
        }