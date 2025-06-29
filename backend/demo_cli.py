#!/usr/bin/env python3
"""Interactive CLI demo for Feel Forward workflow."""

import json
import datetime
from typing import List, Optional
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

class FeelForwardDemo:
    def __init__(self):
        self.topic = ""
        self.factors: List[FactorCategory] = []
        self.preferences: List[Preference] = []
        self.scenarios: List[Scenario] = []
        self.reactions: List[Reaction] = []
        self.insights = ""
        
        # Initialize agents
        self.agent0 = FactorDiscoveryAgent()
        self.agent1 = PreferenceDetailAgent()
        self.agent2 = ScenarioBuilderAgent()
        self.agent3 = EmotionalReactionAgent()
        self.agent4 = InsightSynthesisAgent()
    
    def print_header(self, text: str):
        print("\n" + "="*60)
        print(f"  {text}")
        print("="*60)
    
    def print_subheader(self, text: str):
        print(f"\n🔹 {text}")
        print("-" * 40)
    
    def get_input(self, prompt: str, default: str = "") -> str:
        """Get user input with optional default."""
        if default:
            user_input = input(f"{prompt} [{default}]: ").strip()
            return user_input if user_input else default
        return input(f"{prompt}: ").strip()
    
    def get_int_input(self, prompt: str, min_val: int = 1, max_val: int = 10) -> int:
        """Get integer input within range."""
        while True:
            try:
                user_input = input(f"{prompt} ({min_val}-{max_val}): ").strip()
                if not user_input:
                    print(f"Please enter a number between {min_val} and {max_val}")
                    continue
                value = int(user_input)
                if min_val <= value <= max_val:
                    return value
                print(f"Please enter a number between {min_val} and {max_val}")
            except ValueError:
                print("Please enter a valid number (not text)")
            except (EOFError, KeyboardInterrupt):
                raise KeyboardInterrupt("Demo interrupted by user")
    
    def phase0_factor_discovery(self):
        """Phase 0: Discover decision factors."""
        self.print_header("PHASE 0: FACTOR DISCOVERY")
        
        print("Welcome to Feel Forward! This tool helps you gain emotional clarity")
        print("about important decisions through a structured 5-phase process.\n")
        
        # Get decision topic
        self.topic = self.get_input(
            "What decision are you trying to make?", 
            "choosing a job"
        )
        
        print(f"\n🔍 Discovering factors for: {self.topic}")
        print("Generating relevant decision factors...")
        
        self.factors = self.agent0.run(self.topic)
        
        print(f"\n✅ Generated {len(self.factors)} factor categories:")
        for i, category in enumerate(self.factors, 1):
            print(f"\n{i}. 📂 {category.category} ({len(category.items)} factors)")
            for item in category.items:
                print(f"   • {item}")
        
        input("\nPress Enter to continue to Phase 1...")
    
    def phase1_preference_detailing(self):
        """Phase 1: Detail preferences with importance and limits."""
        self.print_header("PHASE 1: PREFERENCE DETAILING")
        
        print("Now let's select which factors matter most to you and get detailed")
        print("about your preferences, importance levels, and any hard limits.\n")
        
        # Let user select factors
        selected_factors = []
        
        print("Select factors that are important to your decision:")
        print("(Enter factor numbers separated by commas, e.g., 1,3,7)")
        
        # Show numbered list of all factors
        all_factors = []
        for category in self.factors:
            all_factors.extend(category.items)
        
        for i, factor in enumerate(all_factors, 1):
            print(f"{i:2d}. {factor}")
        
        while True:
            try:
                selection = input(f"\nSelect factors (1-{len(all_factors)}): ").strip()
                if not selection:
                    print("Please select at least one factor")
                    continue
                
                indices = [int(x.strip()) - 1 for x in selection.split(',')]
                if all(0 <= idx < len(all_factors) for idx in indices):
                    selected_factors = [all_factors[idx] for idx in indices]
                    break
                else:
                    print(f"Please enter numbers between 1 and {len(all_factors)}")
            except ValueError:
                print("Please enter numbers separated by commas")
        
        print(f"\n✅ You selected {len(selected_factors)} factors:")
        for factor in selected_factors:
            print(f"   • {factor}")
        
        # Create basic preferences
        basic_prefs = [
            Preference(factor=factor, importance=0, hasLimit=False) 
            for factor in selected_factors
        ]
        
        print(f"\n🔧 Enriching your preferences with AI analysis...")
        self.preferences = self.agent1.run(basic_prefs, self.topic)
        
        print(f"\n✨ Here are your enriched preferences:")
        for pref in self.preferences:
            importance_bar = "🟢" * pref.importance + "⚪" * (10-pref.importance)
            print(f"\n📌 {pref.factor}")
            print(f"   Importance: {importance_bar} ({pref.importance}/10)")
            if pref.hasLimit and pref.limit:
                print(f"   Hard limit: {pref.limit}")
            if pref.tradeoff:
                print(f"   Trade-off note: {pref.tradeoff}")
        
        # Ask if user wants to adjust anything
        print("\nWould you like to adjust any importance levels? (y/n)")
        if input().lower().startswith('y'):
            for i, pref in enumerate(self.preferences):
                current = pref.importance
                new_importance = self.get_int_input(
                    f"Importance for '{pref.factor}' (currently {current})"
                )
                if new_importance != current:
                    self.preferences[i].importance = new_importance
                    print(f"Updated to {new_importance}/10")
        
        input("\nPress Enter to continue to Phase 2...")
    
    def phase2_scenario_generation(self):
        """Phase 2: Generate scenarios that test preferences."""
        self.print_header("PHASE 2: SCENARIO GENERATION")
        
        print("Now I'll create realistic scenarios that test your preferences")
        print("through trade-offs and challenging situations.\n")
        
        print("🎭 Generating scenarios...")
        self.scenarios = self.agent2.run(self.preferences, self.topic)
        
        print(f"✅ Generated {len(self.scenarios)} scenarios for you to react to:\n")
        
        for i, scenario in enumerate(self.scenarios, 1):
            print(f"{i}. 📖 {scenario.title}")
            print(f"   {scenario.text}")
            print()
        
        input("Press Enter to continue to Phase 3...")
    
    def phase3_emotional_reactions(self):
        """Phase 3: Capture emotional reactions to scenarios."""
        self.print_header("PHASE 3: EMOTIONAL CALIBRATION")
        
        print("Now for the most important part - your gut reactions!")
        print("I'll show you each scenario and ask for your emotional response.")
        print("Be honest about what you feel, not what you think you should feel.\n")
        
        for i, scenario in enumerate(self.scenarios, 1):
            self.print_subheader(f"Scenario {i}: {scenario.title}")
            print(scenario.text)
            print()
            
            # Get emotional ratings
            excitement = self.get_int_input("How excited does this make you feel?", 0, 10)
            anxiety = self.get_int_input("How anxious does this make you feel?", 0, 10)
            
            # Get body sensation
            print("\nBody sensations (optional):")
            print("Examples: energized, tense, relaxed, heavy, light, warm, cold...")
            body = input("What do you notice in your body? ").strip()
            
            # Get thoughts
            print("\nThoughts/reactions (optional):")
            freeform = input("What thoughts come up for you? ").strip()
            
            # Create reaction
            reaction = Reaction(
                scenario_id=scenario.id,
                excitement=excitement,
                anxiety=anxiety,
                body=body if body else "No specific sensations noted",
                freeform=freeform if freeform else "No additional thoughts"
            )
            
            # Get AI analysis
            analysis = self.agent3.run(reaction, scenario)
            self.reactions.append(reaction)
            
            print(f"\n💡 Quick insight: {analysis}")
            print("\n" + "-"*50)
        
        # Show overall pattern
        patterns = self.agent3.get_reaction_patterns()
        if patterns:
            print(f"\n📊 Your overall emotional patterns:")
            print(f"   Average excitement: {patterns['avg_excitement']}/10")
            print(f"   Average anxiety: {patterns['avg_anxiety']}/10")
            print(f"   Emotional tendency: {patterns['emotional_tendency']}")
            print(f"   High excitement scenarios: {patterns['high_excitement_scenarios']}")
            print(f"   High anxiety scenarios: {patterns['high_anxiety_scenarios']}")
        
        input("\nPress Enter to continue to Phase 4...")
    
    def phase4_insight_synthesis(self):
        """Phase 4: Generate comprehensive insights."""
        self.print_header("PHASE 4: INSIGHT SYNTHESIS")
        
        print("Now let me analyze all your data to reveal patterns about")
        print("your decision-making and what your emotional responses reveal.\n")
        
        print("🧠 Synthesizing insights from your complete journey...")
        self.insights = self.agent4.run(self.reactions, self.preferences, self.scenarios, self.topic)
        
        print("✨ YOUR PERSONALIZED INSIGHTS:")
        print("="*60)
        print(self.insights)
        print("="*60)
        
        # Show summary stats
        print(f"\n📈 DECISION JOURNEY SUMMARY:")
        print(f"   Topic: {self.topic}")
        print(f"   Factors explored: {sum(len(cat.items) for cat in self.factors)}")
        print(f"   Preferences detailed: {len(self.preferences)}")
        print(f"   Scenarios evaluated: {len(self.scenarios)}")
        print(f"   Emotional reactions captured: {len(self.reactions)}")
        
        # Highlight key preferences
        top_prefs = sorted(self.preferences, key=lambda p: p.importance, reverse=True)[:3]
        print(f"\n🎯 YOUR TOP 3 PRIORITIES:")
        for i, pref in enumerate(top_prefs, 1):
            print(f"   {i}. {pref.factor} (importance: {pref.importance}/10)")
        
        # Show most/least exciting scenarios
        if self.reactions:
            most_exciting = max(self.reactions, key=lambda r: r.excitement)
            most_anxious = max(self.reactions, key=lambda r: r.anxiety)
            
            most_exciting_scenario = next(s for s in self.scenarios if s.id == most_exciting.scenario_id)
            most_anxious_scenario = next(s for s in self.scenarios if s.id == most_anxious.scenario_id)
            
            print(f"\n🎉 MOST EXCITING SCENARIO:")
            print(f"   '{most_exciting_scenario.title}' (excitement: {most_exciting.excitement}/10)")
            
            print(f"\n😰 MOST ANXIETY-PROVOKING SCENARIO:")
            print(f"   '{most_anxious_scenario.title}' (anxiety: {most_anxious.anxiety}/10)")
    
    def load_session(self):
        """Load a previous session from file."""
        import os
        import glob
        
        # Look for existing session files
        session_files = glob.glob("feel_forward_session_*.json")
        if not session_files:
            return False
        
        print(f"\n📂 Found {len(session_files)} previous session(s):")
        for i, file in enumerate(session_files, 1):
            try:
                with open(file, 'r') as f:
                    data = json.load(f)
                    topic = data.get('topic', 'Unknown')
                    timestamp = os.path.getctime(file)
                    import datetime
                    date_str = datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M')
                print(f"  {i}. {topic} (saved {date_str})")
            except:
                print(f"  {i}. {file} (corrupted)")
        
        choice = input(f"\nLoad a session? (1-{len(session_files)}, or 'n' for new): ").strip()
        if choice.lower() == 'n' or not choice:
            return False
        
        try:
            file_index = int(choice) - 1
            if 0 <= file_index < len(session_files):
                filename = session_files[file_index]
                with open(filename, 'r') as f:
                    data = json.load(f)
                
                # Restore session state
                self.topic = data.get('topic', '')
                self.factors = [FactorCategory(**cat) for cat in data.get('factors', [])]
                self.preferences = [Preference(**pref) for pref in data.get('preferences', [])]
                self.scenarios = [Scenario(**scenario) for scenario in data.get('scenarios', [])]
                self.reactions = [Reaction(**reaction) for reaction in data.get('reactions', [])]
                self.insights = data.get('insights', '')
                
                print(f"✅ Session loaded from {filename}")
                return True
            else:
                print("Invalid selection, starting new session")
                return False
        except (ValueError, FileNotFoundError, json.JSONDecodeError) as e:
            print(f"❌ Error loading session: {e}")
            return False

    def save_session(self):
        """Save session data to file."""
        print(f"\n💾 Would you like to save your session data? (y/n)")
        if input().lower().startswith('y'):
            # Create timestamp-based filename for uniqueness
            import datetime
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_topic = "".join(c for c in self.topic if c.isalnum() or c in (' ', '_')).replace(' ', '_')
            filename = f"feel_forward_session_{safe_topic}_{timestamp}.json"
            
            session_data = {
                "version": "1.0",
                "timestamp": datetime.datetime.now().isoformat(),
                "topic": self.topic,
                "factors": [cat.dict() for cat in self.factors],
                "preferences": [pref.dict() for pref in self.preferences],
                "scenarios": [scenario.dict() for scenario in self.scenarios],
                "reactions": [reaction.dict() for reaction in self.reactions],
                "insights": self.insights,
                "summary": {
                    "total_factors": sum(len(cat.items) for cat in self.factors),
                    "preferences_count": len(self.preferences),
                    "scenarios_count": len(self.scenarios),
                    "reactions_count": len(self.reactions)
                }
            }
            
            try:
                with open(filename, 'w') as f:
                    json.dump(session_data, f, indent=2)
                print(f"✅ Session saved to {filename}")
                
                # Offer to export as markdown
                if input("Export summary as markdown report? (y/n): ").lower().startswith('y'):
                    self.export_markdown_report(filename.replace('.json', '_report.md'))
            except Exception as e:
                print(f"❌ Error saving session: {e}")
    
    def export_markdown_report(self, filename: str):
        """Export session as a formatted markdown report."""
        try:
            with open(filename, 'w') as f:
                f.write(f"# Feel Forward Decision Analysis Report\n\n")
                f.write(f"**Decision Topic:** {self.topic}\n")
                f.write(f"**Analysis Date:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                # Executive Summary
                if self.insights:
                    f.write(f"## Executive Summary\n\n{self.insights}\n\n")
                
                # Top Preferences
                if self.preferences:
                    top_prefs = sorted(self.preferences, key=lambda p: p.importance, reverse=True)[:3]
                    f.write(f"## Top Priorities\n\n")
                    for i, pref in enumerate(top_prefs, 1):
                        f.write(f"{i}. **{pref.factor}** (Importance: {pref.importance}/10)\n")
                        if pref.hasLimit and pref.limit:
                            f.write(f"   - Requirement: {pref.limit}\n")
                    f.write("\n")
                
                # Emotional Patterns
                if self.reactions:
                    patterns = self.agent3.get_reaction_patterns()
                    f.write(f"## Emotional Response Patterns\n\n")
                    f.write(f"- **Average Excitement:** {patterns.get('avg_excitement', 0)}/10\n")
                    f.write(f"- **Average Anxiety:** {patterns.get('avg_anxiety', 0)}/10\n")
                    f.write(f"- **Emotional Tendency:** {patterns.get('emotional_tendency', 'unknown').title()}\n")
                    f.write(f"- **High Excitement Scenarios:** {patterns.get('high_excitement_scenarios', 0)}\n")
                    f.write(f"- **High Anxiety Scenarios:** {patterns.get('high_anxiety_scenarios', 0)}\n\n")
                
                # Scenario Analysis
                if self.scenarios and self.reactions:
                    f.write(f"## Scenario Reactions\n\n")
                    for scenario in self.scenarios:
                        reaction = next((r for r in self.reactions if r.scenario_id == scenario.id), None)
                        if reaction:
                            f.write(f"### {scenario.title}\n")
                            f.write(f"**Excitement:** {reaction.excitement}/10 | **Anxiety:** {reaction.anxiety}/10\n\n")
                            f.write(f"{scenario.text}\n\n")
                            if reaction.freeform and reaction.freeform != "No additional thoughts":
                                f.write(f"**Your thoughts:** {reaction.freeform}\n\n")
                
                # Complete Preferences
                if self.preferences:
                    f.write(f"## Complete Preference Analysis\n\n")
                    for pref in sorted(self.preferences, key=lambda p: p.importance, reverse=True):
                        f.write(f"- **{pref.factor}:** {pref.importance}/10")
                        if pref.hasLimit and pref.limit:
                            f.write(f" (Requirement: {pref.limit})")
                        if pref.tradeoff:
                            f.write(f" - {pref.tradeoff}")
                        f.write(f"\n")
                
                f.write(f"\n---\n*Generated by Feel Forward Decision Analysis Tool*\n")
            
            print(f"✅ Markdown report exported to {filename}")
        except Exception as e:
            print(f"❌ Error exporting report: {e}")
    
    def resume_from_phase(self):
        """Resume demo from a specific phase based on loaded data."""
        if not self.preferences:
            print("Resuming from Phase 1 (Preference Detailing)...")
            self.phase1_preference_detailing()
        
        if not self.scenarios:
            print("Resuming from Phase 2 (Scenario Generation)...")
            self.phase2_scenario_generation()
        
        if not self.reactions:
            print("Resuming from Phase 3 (Emotional Reactions)...")
            self.phase3_emotional_reactions()
        
        if not self.insights:
            print("Resuming from Phase 4 (Insight Synthesis)...")
            self.phase4_insight_synthesis()
        else:
            print("\n✅ Session already complete! Here's your summary:")
            self.phase4_insight_synthesis()

    def run_demo(self):
        """Run the complete demo experience."""
        try:
            print("🎯 FEEL FORWARD - Interactive Demo")
            print("=" * 50)
            
            # Check for existing sessions
            if self.load_session():
                print(f"\n📋 Loaded session: {self.topic}")
                print("Resuming from where you left off...\n")
                self.resume_from_phase()
            else:
                # Start fresh
                self.phase0_factor_discovery()
                self.phase1_preference_detailing()
                self.phase2_scenario_generation()
                self.phase3_emotional_reactions()
                self.phase4_insight_synthesis()
            
            self.save_session()
            
            print(f"\n🎉 Demo Complete!")
            print("Thank you for exploring Feel Forward. Your emotional reactions")
            print("have revealed important insights about your decision-making process.")
            print("\nRemember: Trust both your logical analysis AND your gut feelings!")
            
        except KeyboardInterrupt:
            print(f"\n\n👋 Demo interrupted.")
            # Auto-save progress
            if self.topic:
                try:
                    import datetime
                    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
                    safe_topic = "".join(c for c in self.topic if c.isalnum() or c in (' ', '_')).replace(' ', '_')
                    filename = f"feel_forward_session_{safe_topic}_{timestamp}_interrupted.json"
                    
                    session_data = {
                        "version": "1.0",
                        "timestamp": datetime.datetime.now().isoformat(),
                        "topic": self.topic,
                        "factors": [cat.dict() for cat in self.factors],
                        "preferences": [pref.dict() for pref in self.preferences],
                        "scenarios": [scenario.dict() for scenario in self.scenarios],
                        "reactions": [reaction.dict() for reaction in self.reactions],
                        "insights": self.insights,
                        "status": "interrupted"
                    }
                    
                    with open(filename, 'w') as f:
                        json.dump(session_data, f, indent=2)
                    print(f"✅ Progress auto-saved to {filename}")
                    print("You can resume this session next time you run the demo.")
                except Exception as e:
                    print(f"❌ Could not auto-save progress: {e}")
                    
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")
            print("Please check your environment and try again.")

def main():
    """Main entry point for the demo."""
    demo = FeelForwardDemo()
    demo.run_demo()

if __name__ == "__main__":
    main()