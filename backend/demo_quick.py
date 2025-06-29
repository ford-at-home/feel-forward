#!/usr/bin/env python3
"""Quick demo showing Feel Forward workflow with preset inputs."""

from models import Preference, FactorCategory, Scenario, Reaction
from strands.agent import (
    FactorDiscoveryAgent, PreferenceDetailAgent, ScenarioBuilderAgent,
    EmotionalReactionAgent, InsightSynthesisAgent
)

def print_header(text: str):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def main():
    print("🎯 FEEL FORWARD - Quick Demo")
    print("Demonstrating the complete workflow with preset inputs\n")
    
    topic = "choosing a job"
    
    # Phase 0: Factor Discovery
    print_header("PHASE 0: FACTOR DISCOVERY")
    print(f"🔍 Topic: {topic}")
    
    agent0 = FactorDiscoveryAgent()
    factors = agent0.run(topic)
    
    print(f"✅ Generated {len(factors)} factor categories:")
    for category in factors:
        print(f"  📂 {category.category}: {', '.join(category.items[:3])}...")
    
    # Phase 1: Preference Detailing
    print_header("PHASE 1: PREFERENCE DETAILING")
    
    # Simulate user selecting some factors
    selected_factors = []
    for category in factors[:2]:
        selected_factors.extend(category.items[:2])
    
    print(f"🎯 Selected factors: {', '.join(selected_factors)}")
    
    basic_prefs = [
        Preference(factor=factor, importance=0, hasLimit=False) 
        for factor in selected_factors
    ]
    
    agent1 = PreferenceDetailAgent()
    enriched_prefs = agent1.run(basic_prefs, topic)
    
    print(f"✅ Enriched to {len(enriched_prefs)} detailed preferences:")
    for pref in enriched_prefs:
        print(f"  📌 {pref.factor}: {pref.importance}/10")
        if pref.hasLimit and pref.limit:
            print(f"     Requirement: {pref.limit}")
    
    # Phase 2: Scenario Generation
    print_header("PHASE 2: SCENARIO GENERATION")
    
    agent2 = ScenarioBuilderAgent()
    scenarios = agent2.run(enriched_prefs, topic)
    
    print(f"✅ Generated {len(scenarios)} scenarios:")
    for scenario in scenarios:
        print(f"  📖 {scenario.title}")
        print(f"     {scenario.text[:80]}...")
    
    # Phase 3: Emotional Reactions
    print_header("PHASE 3: EMOTIONAL CALIBRATION")
    
    reactions = []
    agent3 = EmotionalReactionAgent()
    
    print("🎭 Simulating emotional reactions:")
    for i, scenario in enumerate(scenarios):
        excitement = 7 - i
        anxiety = 3 + i
        
        reaction = Reaction(
            scenario_id=scenario.id,
            excitement=excitement,
            anxiety=anxiety,
            body=f"Felt {['energetic', 'tense'][i % 2]}",
            freeform=f"This makes me think about {['growth', 'stability'][i % 2]}"
        )
        
        analysis = agent3.run(reaction, scenario)
        reactions.append(reaction)
        
        print(f"  🎯 {scenario.title}: Excitement {excitement}/10, Anxiety {anxiety}/10")
        print(f"     💡 {analysis}")
    
    # Phase 4: Insight Synthesis
    print_header("PHASE 4: INSIGHT SYNTHESIS")
    
    agent4 = InsightSynthesisAgent()
    insights = agent4.run(reactions, enriched_prefs, scenarios, topic)
    
    print("🧠 COMPREHENSIVE INSIGHTS:")
    print("="*60)
    print(insights)
    print("="*60)
    
    # Summary
    patterns = agent3.get_reaction_patterns()
    print(f"\n📊 EMOTIONAL PATTERNS:")
    print(f"   Average excitement: {patterns.get('avg_excitement', 0)}/10")
    print(f"   Average anxiety: {patterns.get('avg_anxiety', 0)}/10")
    print(f"   Emotional tendency: {patterns.get('emotional_tendency', 'unknown')}")
    
    print(f"\n🎉 Demo complete! The Feel Forward workflow successfully:")
    print(f"   • Discovered {sum(len(cat.items) for cat in factors)} relevant factors")
    print(f"   • Enriched {len(enriched_prefs)} preferences with importance and limits")
    print(f"   • Generated {len(scenarios)} testing scenarios")
    print(f"   • Captured {len(reactions)} emotional reactions")
    print(f"   • Synthesized personalized insights about decision-making patterns")
    
    print(f"\nℹ️  For the full interactive experience, use the API endpoints or")
    print(f"   run the demo in an interactive terminal with 'python demo_cli.py'")

if __name__ == "__main__":
    main()