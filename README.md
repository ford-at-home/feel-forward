# Feel Forward Backend

This repository provides the API for Feel Forward, a multi‑phase self‑awareness app. The FastAPI service exposes five endpoints for each phase of the workflow and relies on optional OpenAI integration.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running the API

```bash
uvicorn api:app --reload
```

The server runs locally at `http://localhost:8000`. CORS is enabled for `https://feelfwd.app` and `https://www.feelfwd.app`.

## Endpoints

- `POST /phase0/factors`
- `POST /phase1/preferences`
- `POST /phase2/scenarios`
- `POST /phase3/reactions`
- `POST /phase4/summary`

All endpoints accept and return JSON. Requests exceeding the rate limit return a `429` response. See `models.py` for schema details.

## Directory Overview

- `api.py` – FastAPI application
- `models.py` – Pydantic request and response models
- `strands/` – Phase agents (see `strands/README.md`)
- `tests/` – Backend tests
- `PROMPTS.md`, `SPECS.md`, `AI_GUIDE.md` – project documentation

## Testing

Run the unit tests with:

```bash
pytest
```

## Deployment Notes

Set the environment variable `OPENAI_API_KEY` to enable LLM features. The code is ready to be containerized and deployed on AWS using your preferred approach (e.g., ECS, Lambda, or EC2).

## Infrastructure

The `infra/` directory contains an AWS CDK app that provisions Route 53 records and static hosting for the frontend. Run `cdk deploy` as described in `infra/README.md` to bootstrap DNS and hosting automatically.

An AI agent handles frontend deployments, while a human collaborator manages DNS and domain records.

Set the environment variable `OPENAI_API_KEY` to enable LLM features. The code is ready to be containerized and deployed on AWS using your preferred approach (e.g., ECS, Lambda, or EC2). See DEPLOY.md for step-by-step AWS deployment instructions.
