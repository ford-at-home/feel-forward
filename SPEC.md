# Feel Forward — Technical Specifications

## Overview

Feel Forward helps users gain emotional clarity about their preferences by walking them through a structured LLM-powered workflow. The full system is broken into five phases, powered by modular agents and phasers.

---

## System Architecture

### PHASE 0: Exploratory Preference Discovery
- **Agent:** `FactorDiscoveryAgent`
- **Function:** Lists known decision variables by category
- **User Action:** Selects relevant ones and adds new ones
- **Phaser:** `FactorNormalizerPhaser`

### PHASE 1: Preference Detailing
- **Agent:** `PreferenceDetailAgent`
- **Function:** Interviews user to define each preference's direction, strength, and trade-offs
- **Phaser:** `PreferenceWeightingPhaser`

### PHASE 2: Scenario Generation
- **Agent:** `ScenarioBuilderAgent`
- **Function:** Combines preferences into narrative “real world” situations
- **Phaser:** `ScenarioValidatorPhaser`

### PHASE 3: Emotional Calibration
- **Agent:** `EmotionalReactionAgent`
- **Function:** Prompts user for emotional + somatic response
- **Phaser:** `EmotionExtractorPhaser`

### PHASE 4: Insight Synthesis
- **Agent:** `InsightSynthesisAgent`
- **Function:** Clusters emotion responses, flags contradictions
- **Phaser:** `InsightFormatterPhaser`

### PHASE 5: Final Summary
- **Agent:** `SummaryAgent` (optional)
- **Function:** Outputs a concise statement of what the user truly wants

---

## Design Principles

- Modular, pluggable agent structure
- Transparent emotional reasoning
- Manual fallback (PROMPTS.md) and agentic automation
- Reusability across domains: jobs, relationships, housing, etc.
- Stored state via JSON/YAML profile object

---

## Key Data Types

### `UserPreference`
```json
{
  "key": "commute",
  "type": "distance",
  "preferred": "under 30 minutes",
  "weight": 0.9,
  "hard_limit": true
}
