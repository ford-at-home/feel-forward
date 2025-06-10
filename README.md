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
- `infra/` – AWS CDK infrastructure code
- `PROMPTS.md`, `SPECS.md`, `AI_GUIDE.md` – project documentation

## Testing

Run the unit tests with:

```bash
pytest
```

## Deployment

### Automated Deployment

The easiest way to deploy is using the Makefile:

```bash
# Deploy infrastructure and push image
make deploy

# Or deploy step by step
make infra    # Deploy AWS infrastructure
make push     # Build and push Docker image
```

### Manual Deployment

Set the environment variable `OPENAI_API_KEY` to enable LLM features. See [DEPLOY.md](DEPLOY.md) for detailed manual deployment steps.

## Infrastructure

The `infra/` directory contains an AWS CDK app that provisions the complete backend infrastructure:

- **ECS Fargate**: Containerized API service with auto-scaling
- **Application Load Balancer**: Traffic distribution and health checks
- **ECR Repository**: Docker image storage
- **Secrets Manager**: Secure storage for OpenAI API key
- **Route53**: DNS management for api.feelfwd.app
- **CloudWatch**: Logging and monitoring

Run `make infra` to deploy the infrastructure, or see `infra/README.md` for detailed instructions.

