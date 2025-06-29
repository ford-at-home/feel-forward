# Infrastructure

This folder contains an AWS CDK app that provisions the complete backend infrastructure for Feel Forward.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.12+
- Docker installed for building the API image

## Deploy

```bash
cd infra
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cdk deploy \
  -c domain=feelfwd.app \
  -c apiDomain=api.feelfwd.app
```

After deployment, build and push the Docker image to the ECR repository:

```bash
# Build the image
docker build -t feel-forward ..

# Get the ECR repository URI from CDK outputs
REPO_URI=$(aws cloudformation describe-stacks --stack-name BackendStack --query 'Stacks[0].Outputs[?OutputKey==`repositoryUri`].OutputValue' --output text)

# Tag and push the image
docker tag feel-forward:latest $REPO_URI:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $REPO_URI
docker push $REPO_URI:latest
```

The API will be available at `https://api.feelfwd.app`.

## Infrastructure Components

### BackendStack (Complete Infrastructure)
- **Route53 Hosted Zone**: DNS management for feelfwd.app
- **Route53 Records**: DNS records including api.feelfwd.app and www.feelfwd.app
- **ECS Fargate**: Containerized API service with auto-scaling
- **Application Load Balancer**: Traffic distribution and health checks
- **ECR Repository**: Docker image storage
- **Secrets Manager**: Secure storage for OpenAI API key
- **CloudWatch**: Logging and monitoring
