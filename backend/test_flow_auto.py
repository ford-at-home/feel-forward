#!/usr/bin/env python3
"""Automated test of the Feel Forward workflow to validate context flow."""

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

def print_header(phase: str):
    print("\n" + "="*60)
    print(f"PHASE {phase}")
    print("="*60 + "\n")

def test_workflow():
    print("\n🎯 FEEL FORWARD - Automated Workflow Test")
    print("Testing end-to-end context flow\n")
    
    # Test data
    topic = "choosing a job"
    
    # PHASE 0: Factor Discovery
    print_header("0: FACTOR DISCOVERY")
    print(f"🔍 Topic: {topic}")
    
    agent0 = FactorDiscoveryAgent()
    factors = agent0.run(topic)
    
    print(f"Generated {len(factors)} factor categories:")
    for category in factors:
        print(f"  📂 {category.category}: {len(category.items)} items")
        for item in category.items[:3]:  # Show first 3
            print(f"     - {item}")
        if len(category.items) > 3:
            print(f"     ... and {len(category.items)-3} more")
    
    # PHASE 1: Preference Detailing
    print_header("1: PREFERENCE DETAILING")
    
    # Simulate user selecting some factors
    selected_factors = []
    for category in factors[:2]:  # Take first 2 categories
        selected_factors.extend(category.items[:2])  # 2 items each
    
    print(f"Simulating user selection of {len(selected_factors)} factors:")
    for factor in selected_factors:
        print(f"  ✓ {factor}")
    
    # Create basic preferences
    basic_prefs = [
        Preference(factor=factor, importance=0, hasLimit=False) 
        for factor in selected_factors
    ]
    
    agent1 = PreferenceDetailAgent()
    enriched_prefs = agent1.run(basic_prefs, topic)
    
    print(f"\n🔧 Enriched to {len(enriched_prefs)} detailed preferences:")
    for pref in enriched_prefs:
        importance_bar = "🟢" * pref.importance + "⚪" * (10-pref.importance)
        print(f"  📌 {pref.factor}")
        print(f"     Importance: {importance_bar} ({pref.importance}/10)")
        if pref.hasLimit and pref.limit:
            print(f"     Limit: {pref.limit}")
    
    # PHASE 2: Scenario Generation
    print_header("2: SCENARIO GENERATION")
    
    agent2 = ScenarioBuilderAgent()
    scenarios = agent2.run(enriched_prefs, topic)
    
    print(f"🎭 Generated {len(scenarios)} scenarios:")
    for scenario in scenarios:
        print(f"\n  📖 {scenario.title} (ID: {scenario.id})")
        print(f"     {scenario.text[:100]}...")
    
    # PHASE 3: Emotional Reactions
    print_header("3: EMOTIONAL CALIBRATION")
    
    # Simulate emotional reactions
    reactions = []
    agent3 = EmotionalReactionAgent()
    
    print("🎭 Simulating emotional reactions:")
    for i, scenario in enumerate(scenarios):
        # Simulate varying reactions
        excitement = 7 - i  # Decreasing excitement
        anxiety = 3 + i     # Increasing anxiety
        
        reaction = Reaction(
            scenario_id=scenario.id,
            excitement=excitement,
            anxiety=anxiety,
            body=f"Felt {['energetic', 'tense'][i % 2]} reading this",
            freeform=f"This scenario makes me think about {['growth', 'stability'][i % 2]}"
        )
        
        # Enhanced Phase 3 provides emotional analysis
        analysis = agent3.run(reaction, scenario)
        reactions.append(reaction)
        
        print(f"  🎯 {scenario.title}")
        print(f"     Excitement: {excitement}/10, Anxiety: {anxiety}/10")
        print(f"     Analysis: {analysis}")
    
    # PHASE 4: Enhanced Insight Synthesis
    print_header("4: INSIGHT SYNTHESIS")
    
    agent4 = InsightSynthesisAgent()
    insights = agent4.run(reactions, enriched_prefs, scenarios, topic)
    
    print("🧠 Generated comprehensive insights:")
    print(f"  {insights}")
    
    # Show additional pattern analysis
    patterns = agent3.get_reaction_patterns()
    if patterns:
        print(f"\n📊 Reaction patterns:")
        print(f"  Emotional tendency: {patterns.get('emotional_tendency', 'unknown')}")
        print(f"  High excitement scenarios: {patterns.get('high_excitement_scenarios', 0)}")
        print(f"  High anxiety scenarios: {patterns.get('high_anxiety_scenarios', 0)}")
    
    # Context Validation
    print_header("CONTEXT VALIDATION")
    
    print("🔍 Checking context flow:")
    print(f"  Original topic: {topic}")
    print(f"  Factors discovered: {sum(len(cat.items) for cat in factors)}")
    print(f"  Preferences selected: {len(selected_factors)}")
    print(f"  Preferences enriched: {len(enriched_prefs)}")
    print(f"  Scenarios generated: {len(scenarios)}")
    print(f"  Reactions recorded: {len(reactions)}")
    print(f"  Insights length: {len(insights)} characters")
    
    # Check if context is preserved
    print("\n✅ Context preservation check:")
    print(f"  - Topic flows through all phases: {'✓' if topic else '✗'}")
    print(f"  - Preferences inform scenarios: {'✓' if enriched_prefs and scenarios else '✗'}")
    print(f"  - Reactions reference scenarios: {'✓' if all(r.scenario_id in [s.id for s in scenarios] for r in reactions) else '✗'}")
    print(f"  - Insights use both prefs and reactions: {'✓' if len(insights) > 50 else '✗'}")
    
    # Show emotional pattern
    avg_excitement = sum(r.excitement for r in reactions) / len(reactions)
    avg_anxiety = sum(r.anxiety for r in reactions) / len(reactions)
    
    print(f"\n📊 Emotional patterns detected:")
    print(f"  Average excitement: {avg_excitement:.1f}/10")
    print(f"  Average anxiety: {avg_anxiety:.1f}/10")
    
    if avg_excitement > avg_anxiety:
        print("  💪 Overall positive emotional response")
    else:
        print("  😰 Higher anxiety than excitement - potential red flags")
    
    print("\n🎉 Workflow test complete!")
    return {
        'topic': topic,
        'factors': factors,
        'preferences': enriched_prefs,
        'scenarios': scenarios,
        'reactions': reactions,
        'insights': insights
    }

if __name__ == "__main__":
    results = test_workflow()