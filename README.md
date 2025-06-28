# Feel Forward Backend

This repository provides the API for Feel Forward, a multi‑phase self‑awareness app. The FastAPI service exposes five endpoints for each phase of the workflow and relies on optional OpenAI integration.

## Quick Start

### Prerequisites

- **AWS CLI** configured with appropriate credentials
- **Python 3.11+** (for local development and CDK)
- **Docker** installed and running
- **Node.js 20+** (for CDK CLI)
- **GitHub Token** for Strands SDK (set as `GITHUB_TOKEN` environment variable)

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the API locally
uvicorn api:app --reload
```

The server runs locally at `http://localhost:8000`. CORS is enabled for `https://feelfwd.app` and `https://www.feelfwd.app`.

## Current Deployment Status

The backend API is currently deployed and accessible at:
- **Load Balancer**: http://Backen-FeelF-qmJKH0QWgejQ-1692421821.us-east-1.elb.amazonaws.com
- **API Domain**: https://api.feelfwd.app (DNS propagation may take up to 48 hours)
- **API Documentation**: https://api.feelfwd.app/docs

## Deployment

### Automated Deployment (Recommended)

The easiest way to deploy is using the Makefile:

```bash
# Complete deployment (infrastructure + image)
make deploy

# Step-by-step deployment
make bootstrap    # Bootstrap CDK environment (first time only)
make infra        # Deploy AWS infrastructure
make build-push   # Build and push Docker image
```

### Manual Deployment

If you prefer manual control:

```bash
# 1. Bootstrap CDK (first time only)
cd infra
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cdk bootstrap

# 2. Deploy infrastructure
cdk deploy -c domain=feelfwd.app -c apiDomain=api.feelfwd.app --require-approval never

# 3. Build and push Docker image
docker build -t feel-forward .
docker tag feel-forward:latest 418272766513.dkr.ecr.us-east-1.amazonaws.com/feel-forward:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 418272766513.dkr.ecr.us-east-1.amazonaws.com
docker push 418272766513.dkr.ecr.us-east-1.amazonaws.com/feel-forward:latest

# 4. Scale up ECS service (if needed)
aws ecs update-service --cluster feel-forward --service <service-name> --desired-count 1 --region us-east-1
```

## Endpoints

- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /openapi.json` - OpenAPI schema
- `POST /phase0/factors` - Discover decision factors
- `POST /phase1/preferences` - Detail preferences
- `POST /phase2/scenarios` - Generate scenarios
- `POST /phase3/reactions` - Log emotional reactions
- `POST /phase4/summary` - Synthesize insights

All POST endpoints accept and return JSON. Requests exceeding the rate limit (60/minute per IP) return a `429` response. See `models.py` for schema details.

## Infrastructure

The `infra/` directory contains an AWS CDK app that provisions the complete backend infrastructure:

- **ECS Fargate**: Containerized API service with auto-scaling (starts with 0 tasks)
- **Application Load Balancer**: Traffic distribution and health checks
- **ECR Repository**: Docker image storage
- **Secrets Manager**: Secure storage for OpenAI API key
- **Route53**: DNS management for api.feelfwd.app
- **CloudWatch**: Logging and monitoring

### Key Design Decisions

1. **ECS Service starts with 0 tasks**: Prevents hanging deployments when Docker image doesn't exist yet
2. **Fargate with public IP**: Allows internet access for the API
3. **Health check on `/health`**: Ensures service availability
4. **Auto-scaling**: Scales based on CPU utilization (70% threshold)

## Troubleshooting

### Common Issues

#### 1. Deployment Hangs on ECS Service Creation
**Symptoms**: Stack stuck in `CREATE_IN_PROGRESS` with "Eventual consistency check initiated"
**Cause**: ECS service trying to start tasks with non-existent Docker image
**Solution**: Ensure Docker image is built and pushed before scaling up ECS service

#### 2. Docker Build Fails
**Symptoms**: "Cannot connect to the Docker daemon"
**Solution**: Start Docker Desktop and wait for it to fully initialize

#### 3. ECS Tasks Not Starting
**Symptoms**: No tasks in target group, health checks failing
**Cause**: Missing network configuration or invalid subnet IDs
**Solution**: Ensure CDK code includes proper network configuration for Fargate service

#### 4. Regional Conflicts
**Symptoms**: "Stack in UPDATE_IN_PROGRESS state"
**Cause**: Multiple stacks in different regions
**Solution**: Delete conflicting stacks in other regions

#### 5. DNS Not Resolving
**Symptoms**: `curl: (6) Could not resolve host: api.feelfwd.app`
**Cause**: DNS propagation delay (can take up to 48 hours)
**Solution**: Wait for propagation or test via load balancer DNS directly

### Debugging Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name BackendStack --region us-east-1

# Check ECS service status
aws ecs list-services --cluster feel-forward --region us-east-1
aws ecs describe-services --cluster feel-forward --region us-east-1 --services <service-name>

# Check ECR repository
aws ecr describe-repositories --repository-names feel-forward --region us-east-1

# Check load balancer
aws elbv2 describe-load-balancers --region us-east-1 | grep FeelF

# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn> --region us-east-1

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/feel-forward" --region us-east-1
```

## Directory Overview

- `api.py` – FastAPI application
- `models.py` – Pydantic request and response models
- `strands/` – Phase agents (see `strands/README.md`)
- `tests/` – Backend tests
- `infra/` – AWS CDK infrastructure code
- `PROMPTS.md`, `SPECS.md`, `AI_GUIDE.md` – project documentation
- `Makefile` – Automated deployment commands

## Testing

Run the unit tests with:

```bash
pytest
```

## Environment Variables

- `GITHUB_TOKEN`: Required for Strands SDK
- `OPENAI_API_KEY`: Optional, enables LLM features
- `AWS_REGION`: Defaults to us-east-1

## Security

- OpenAI API key stored in AWS Secrets Manager
- ECS tasks run in private subnets with NAT gateway
- Load balancer handles SSL termination
- CORS configured for specific domains only

## Frontend

The frontend application is maintained in a separate repository and should be deployed to:
- **Production**: https://feelfwd.app
- **WWW**: https://www.feelfwd.app (CNAME to root domain)

The backend API is configured to accept CORS requests from these domains. The frontend should be configured to use `https://api.feelfwd.app` as the API endpoint.

