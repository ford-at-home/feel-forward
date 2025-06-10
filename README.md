# Feel Forward Agent

A modular agent implementation using strands-agents.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

After installing the dependencies you can launch the FastAPI server:

```bash
uvicorn api:app --reload
```

This starts the API locally at `http://localhost:8000`.

## API Endpoints

The backend exposes the following REST endpoints:

- `POST /phase0/factors`
- `POST /phase1/preferences`
- `POST /phase2/scenarios`
- `POST /phase3/reactions`
- `POST /phase4/summary`

Each endpoint accepts and returns JSON as defined in `models.py`.


## Running Tests

```bash
pytest tests/
```

## Usage

```python
from strands.agent import Agent

# Create an agent
agent = Agent(name="my_agent")

# Process messages
response = agent.process_message("Hello!")
print(response)  # "I am my_agent and I received your message: Hello!"
```

## Project Structure

- `strands/` - Backend logic package
  - `agent.py` - Agent exports
  - `phase0.py` … `phase4.py` - Phase logic modules
  - `__init__.py` - Package initialization
- `models.py` - Pydantic request/response models
- `tests/` - Backend tests
- `requirements.txt` - Project dependencies
- `README.md` - This file

# Feel Forward

**Feel Forward** is a self-awareness and decision-making app that helps users calibrate their emotions against real-life scenarios based on their stated preferences. Instead of vaguely saying "I want a great job," users arrive at something like:

> "I'm looking for a senior architect job doing both coding and product development at a mid- to late-stage startup within 30 miles of home, paying $100k+, with excellent healthcare and a 40-hour workweek."

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

---
## Setting up the Virtual Environment

This project uses a Python virtual environment to manage dependencies.

**To set up and activate the virtual environment:**

1.  Run the command: `venv_up`
2.  This script will:
    * Create a virtual environment named `venv` if it doesn't exist.
    * Activate the virtual environment.
    * Create an empty `requirements.txt` file if it doesn't exist.
    * Install dependencies listed in `requirements.txt` using `pip3 install -r requirements.txt`.
    * Ensure the `venv` directory is excluded from Git tracking by adding it to `.gitignore`.

**Managing Dependencies:**

* List your project dependencies in the `requirements.txt` file (one package per line).
* Install dependencies using: `pip install -r requirements.txt` (this is automatically run by `venv_up` after activation if the file is not empty).
* To add new dependencies, install them with pip while the virtual environment is active and then update `requirements.txt` using: `pip freeze > requirements.txt`

**Deactivating the Virtual Environment:**

* To exit the virtual environment, run the command: `deactivate`

**Excluding from Git:**

* The `venv` directory is automatically added to `.gitignore` to prevent committing environment-specific files.
