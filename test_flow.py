#!/usr/bin/env python3
"""Interactive CLI to test the Feel Forward workflow end-to-end."""

import json
from typing import List
from models import (
    Preference, FactorCategory, Scenario, Reaction
)
from strands.agent import (
    FactorDiscoveryAgent,
    PreferenceDetailAgent,
    ScenarioBuilderAgent,
    EmotionalReactionAgent,
    InsightSynthesisAgent,
)

class FeelForwardCLI:
    def __init__(self):
        self.topic = None
        self.factors = []
        self.preferences = []
        self.scenarios = []
        self.reactions = []
        
    def print_header(self, phase: str):
        print("\n" + "="*60)
        print(f"PHASE {phase}")
        print("="*60 + "\n")
    
    def run(self):
        print("\n🎯 FEEL FORWARD - Interactive Test")
        print("Discover what you really want through emotional clarity\n")
        
        # Phase 0: Factor Discovery
        self.phase0_factors()
        
        # Phase 1: Preference Detailing
        self.phase1_preferences()
        
        # Phase 2: Scenario Generation
        self.phase2_scenarios()
        
        # Phase 3: Emotional Reactions
        self.phase3_reactions()
        
        # Phase 4: Insight Synthesis
        self.phase4_insights()
        
        print("\n✅ Workflow complete! Here's what we learned...\n")
    
    def phase0_factors(self):
        self.print_header("0: FACTOR DISCOVERY")
        
        # Get topic from user
        self.topic = input("What decision are you exploring? (e.g., 'choosing a job', 'moving cities'): ").strip()
        if not self.topic:
            self.topic = "choosing a job"
        
        print(f"\n🔍 Discovering factors for: {self.topic}")
        
        # Run agent
        agent = FactorDiscoveryAgent()
        self.factors = agent.run(self.topic)
        
        # Display factors
        print("\nHere are the key factors to consider:")
        for i, category in enumerate(self.factors):
            print(f"\n{i+1}. {category.category}:")
            for item in category.items:
                print(f"   - {item}")
        
        print("\n" + "-"*40)
    
    def phase1_preferences(self):
        self.print_header("1: PREFERENCE DETAILING")
        
        print("Select which factors matter to you (enter numbers separated by commas):")
        print("For example: 1,3,5,7,9\n")
        
        # Show all factors with numbers
        factor_list = []
        counter = 1
        for category in self.factors:
            print(f"\n{category.category}:")
            for item in category.items:
                print(f"   {counter}. {item}")
                factor_list.append(item)
                counter += 1
        
        # Get user selections
        selections = input("\nYour selections: ").strip()
        if not selections:
            # Default to first 5 for testing
            selected_indices = [0, 1, 2, 3, 4]
        else:
            selected_indices = [int(x.strip())-1 for x in selections.split(",") if x.strip().isdigit()]
        
        # Create basic preferences
        basic_prefs = []
        for idx in selected_indices:
            if 0 <= idx < len(factor_list):
                basic_prefs.append(Preference(
                    factor=factor_list[idx],
                    importance=0,
                    hasLimit=False
                ))
        
        print(f"\n🔧 Enriching your {len(basic_prefs)} preferences...")
        
        # Run enrichment
        agent = PreferenceDetailAgent()
        self.preferences = agent.run(basic_prefs, self.topic)
        
        # Display enriched preferences
        print("\nYour detailed preferences:")
        for pref in self.preferences:
            print(f"\n📌 {pref.factor}")
            print(f"   Importance: {'🟢' * pref.importance + '⚪' * (10-pref.importance)} ({pref.importance}/10)")
            if pref.hasLimit and pref.limit:
                print(f"   Requirement: {pref.limit}")
            if pref.tradeoff:
                print(f"   Trade-off: {pref.tradeoff}")
        
        print("\n" + "-"*40)
    
    def phase2_scenarios(self):
        self.print_header("2: SCENARIO GENERATION")
        
        print(f"🎭 Creating scenarios based on your preferences for {self.topic}...")
        
        # Run scenario generation
        agent = ScenarioBuilderAgent()
        self.scenarios = agent.run(self.preferences, self.topic)
        
        print(f"\nGenerated {len(self.scenarios)} scenarios:\n")
        
        # Display scenarios
        for scenario in self.scenarios:
            print(f"Scenario {scenario.id}: {scenario.title}")
            print("-" * len(f"Scenario {scenario.id}: {scenario.title}"))
            print(scenario.text)
            print()
        
        print("-"*40)
    
    def phase3_reactions(self):
        self.print_header("3: EMOTIONAL CALIBRATION")
        
        print("For each scenario, record your emotional response.\n")
        print("Excitement: How energized/positive do you feel? (0-10)")
        print("Anxiety: How worried/stressed do you feel? (0-10)")
        print("Body: What physical sensations do you notice?")
        print("Thoughts: Any other reactions?\n")
        
        for scenario in self.scenarios:
            print(f"\n📖 Re-reading: {scenario.title}")
            print(f"{scenario.text}\n")
            
            # Get reactions (with defaults for quick testing)
            try:
                excitement = int(input("Excitement (0-10): ") or "5")
                anxiety = int(input("Anxiety (0-10): ") or "5")
            except:
                excitement = 5
                anxiety = 5
            
            body = input("Physical sensations (optional): ").strip() or None
            freeform = input("Other thoughts (optional): ").strip() or None
            
            reaction = Reaction(
                scenario_id=scenario.id,
                excitement=excitement,
                anxiety=anxiety,
                body=body,
                freeform=freeform
            )
            
            # Process reaction
            agent = EmotionalReactionAgent()
            status = agent.run(reaction)
            print(f"✓ Reaction recorded: {status}")
            
            self.reactions.append(reaction)
        
        print("\n" + "-"*40)
    
    def phase4_insights(self):
        self.print_header("4: INSIGHT SYNTHESIS")
        
        print("🧠 Analyzing your emotional patterns...\n")
        
        # Run synthesis
        agent = InsightSynthesisAgent()
        summary = agent.run(self.reactions, self.preferences)
        
        print("Key Insights:")
        print("-" * 13)
        print(summary)
        
        # Also show a quick analysis
        print("\n📊 Quick Stats:")
        avg_excitement = sum(r.excitement for r in self.reactions) / len(self.reactions)
        avg_anxiety = sum(r.anxiety for r in self.reactions) / len(self.reactions)
        
        print(f"Average excitement: {avg_excitement:.1f}/10")
        print(f"Average anxiety: {avg_anxiety:.1f}/10")
        
        # Find most/least exciting scenarios
        most_exciting = max(self.reactions, key=lambda r: r.excitement)
        least_exciting = min(self.reactions, key=lambda r: r.excitement)
        
        most_exciting_scenario = next(s for s in self.scenarios if s.id == most_exciting.scenario_id)
        least_exciting_scenario = next(s for s in self.scenarios if s.id == least_exciting.scenario_id)
        
        print(f"\nMost exciting: {most_exciting_scenario.title} ({most_exciting.excitement}/10)")
        print(f"Least exciting: {least_exciting_scenario.title} ({least_exciting.excitement}/10)")
        
        # Check for contradictions
        high_importance_prefs = [p for p in self.preferences if p.importance >= 8]
        if high_importance_prefs:
            print(f"\n🔍 Your top priorities were:")
            for pref in high_importance_prefs:
                print(f"   - {pref.factor} (importance: {pref.importance}/10)")

if __name__ == "__main__":
    cli = FeelForwardCLI()
    cli.run()