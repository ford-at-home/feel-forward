# Feel Forward – AI Assistant Implementation Guide for Strands

This document is designed to help AI assistants (like ChatGPT or Claude) understand the structure and goals of the Feel Forward Strands implementation, and contribute to its expansion.

---

## 📦 Project Overview

**Feel Forward** is an app that helps users calibrate their emotional responses to real-life decision scenarios. It does this through a multi-phase LLM-powered agentic flow.

This implementation uses the **Strands SDK** to build each phase as a modular, observable AI agent.

---

## 🧠 Current Structure

### /strands/factor_discovery.py

- Defines a `FactorDiscoveryAgent`
- Includes a system prompt that asks the user about life decision factors
- Includes a tool: `save_preferences(preferences: dict)`

### Example Prompt Usage

User: "I'm thinking about changing jobs and want to know what factors matter to me."

Agent behavior:
- Lists 40–60 job-related decision variables
- Asks the user which ones matter and how
- Calls `save_preferences` tool with structured data

---

## 🧩 Planned Agents

Each of these will eventually be their own file:

| Phase                  | Agent Name                | Purpose                                      |
|------------------------|---------------------------|----------------------------------------------|
| 0 - Discovery          | `FactorDiscoveryAgent`    | Help user identify important variables       |
| 1 - Preference Detail  | `PreferenceDetailAgent`   | Collect ranges, thresholds, and trade-offs   |
| 2 - Scenario Gen       | `ScenarioBuilderAgent`    | Generate realistic scenarios from variables  |
| 3 - Reaction Logging   | `EmotionalReactionAgent`  | Prompt user for emotional response           |
| 4 - Pattern Analysis   | `InsightSynthesisAgent`   | Cluster emotional responses and summarize    |

---

## 🛠️ AI Assistant Task Suggestions

If you are helping expand this repo as an AI assistant, here are safe contributions you can make:

- Implement the next agent file (`preference_detail.py`) using the pattern from `factor_discovery.py`
- Add more realistic prompts and memory handling for context retention
- Suggest and document tools to:
  - Classify emotion using Claude or Bedrock
  - Store structured data in JSON
  - Regenerate scenarios with more realism

---

## 💡 Guidelines

- Always document tools with docstrings
- Use `if __name__ == "__main__"` blocks for demo testing
- Structure all agents to accept a single user task input
- Use inline comments to explain prompt logic and expected formats
