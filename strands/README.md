# Strands Package

This directory contains the backend logic for each phase of the Feel Forward workflow. Each module defines an agent that can optionally use OpenAI to generate or process data.

- `agent.py` – exports the phase agents for easy import.
- `phase0.py` – factor discovery logic.
- `phase1.py` – preference detailing logic.
- `phase2.py` – scenario generation.
- `phase3.py` – reaction logging.
- `phase4.py` – insight synthesis.
- `utils.py` – helper utilities (e.g., LLM configuration).
