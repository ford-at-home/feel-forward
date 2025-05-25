# Feel Forward

**Feel Forward** is a self-awareness and decision-making app that helps users calibrate their emotions against real-life scenarios based on their stated preferences. Instead of vaguely saying “I want a great job,” users arrive at something like:

> “I’m looking for a senior architect job doing both coding and product development at a mid- to late-stage startup within 30 miles of home, paying $100k+, with excellent healthcare and a 40-hour workweek.”

The tool elicits personal preferences, generates realistic scenarios, and prompts emotional responses — producing a digest of what users actually want, not just what they think they want.

This repo includes both the **manual prototype** for prompt-based use and specs for the future multi-agent system.

---

## Features

- Exploratory discovery of hidden preferences
- Emotionally rich scenario generation
- Guided journaling and body-awareness check-ins
- Insight synthesis + preference summary
- Manual LLM prompt flow (for Claude, ChatGPT, etc.)
- Modular agentic system design for future development

---

## Quickstart (Manual Prototype)

1. Open [`PROMPTS.md`](PROMPTS.md) and follow the Phase 0–5 prompts.
2. Copy/paste into your preferred LLM (Claude, ChatGPT).
3. Save output between phases in `.txt` files.
4. At the end, you'll receive a summary of what actually matters to you.

---

## Future Roadmap

- [ ] Convert prompts into LangChain or Semantic Kernel agents
- [ ] Add emotion classifier and preference clustering logic
- [ ] Render emotional heatmaps and pattern visualizations
- [ ] API integration for syncing scenarios and results

---

## License

MIT
