# Backend Deployment Guide

This guide covers deploying the Feel Forward backend API to AWS.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Docker installed and running
- Python 3.11+ with pip
- Node.js 20+ (for CDK CLI)
- GitHub Token for Strands SDK

## Environment Setup

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure required variables**:
   - `GITHUB_TOKEN`: Required for Strands SDK
   - `OPENAI_API_KEY`: Optional for LLM features
   - `AWS_REGION`: Defaults to us-east-1

## Automated Deployment

The easiest way to deploy is using the Makefile:

```bash
# Complete deployment (infrastructure + Docker image)
make deploy

# Or step-by-step:
make bootstrap    # Bootstrap CDK (first time only)
make infra        # Deploy AWS infrastructure
make build-push   # Build and push Docker image
```

## Manual Deployment Steps

### 1. Bootstrap CDK Environment (First Time Only)

```bash
cd backend/infra
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cdk bootstrap
```

### 2. Deploy Infrastructure

```bash
cdk deploy -c domain=feelfwd.app -c apiDomain=api.feelfwd.app --require-approval never
```

This creates:
- ECS Fargate cluster and service
- Application Load Balancer
- ECR repository for Docker images
- Route53 DNS records
- Secrets Manager for API keys
- CloudWatch logs

### 3. Build and Push Docker Image

```bash
# Build the image
docker build -t feel-forward backend/

# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 418272766513.dkr.ecr.us-east-1.amazonaws.com

# Tag the image
docker tag feel-forward:latest 418272766513.dkr.ecr.us-east-1.amazonaws.com/feel-forward:latest

# Push to ECR
docker push 418272766513.dkr.ecr.us-east-1.amazonaws.com/feel-forward:latest
```

### 4. Scale Up ECS Service

The service starts with 0 tasks to prevent deployment hangs. After pushing the image:

```bash
# Get the service name
SERVICE_NAME=$(aws ecs list-services --cluster feel-forward --region us-east-1 --query 'serviceArns[0]' --output text | cut -d'/' -f3)

# Scale up to 1 task
aws ecs update-service --cluster feel-forward --service $SERVICE_NAME --desired-count 1 --region us-east-1
```

## Verify Deployment

1. **Check service health**:
   ```bash
   make describe-services
   ```

2. **View logs**:
   ```bash
   make logs
   ```

3. **Test endpoints**:
   ```bash
   # Health check
   curl https://api.feelfwd.app/health
   
   # API documentation
   open https://api.feelfwd.app/docs
   ```

## Infrastructure Details

### ECS Configuration
- **Cluster**: feel-forward
- **Service**: Auto-scaling (1-5 tasks)
- **CPU**: 256 units
- **Memory**: 512 MB
- **Auto-scaling**: Based on 70% CPU utilization

### Load Balancer
- **Type**: Application Load Balancer
- **Health Check**: /health endpoint
- **Timeout**: 60 seconds
- **Interval**: 30 seconds

### Networking
- **VPC**: Default VPC with public subnets
- **Security Group**: Allows HTTP/HTTPS traffic
- **DNS**: api.feelfwd.app → ALB

## Troubleshooting

### Deployment Hangs
**Cause**: ECS trying to start tasks with non-existent Docker image
**Solution**: Ensure Docker image is pushed before scaling up service

### Tasks Not Starting
**Cause**: Missing network configuration
**Solution**: Check CDK includes proper Fargate network settings

### DNS Not Resolving
**Cause**: DNS propagation delay (up to 48 hours)
**Solution**: Test via load balancer DNS directly

### Docker Build Fails
**Cause**: Docker daemon not running
**Solution**: Start Docker Desktop and wait for initialization

## Monitoring

- **CloudWatch Logs**: `/ecs/feel-forward`
- **Metrics**: CPU, memory, request count
- **Alarms**: High CPU utilization, unhealthy targets

## Updating the Service

To deploy updates:

```bash
# Build and push new image
make build-push

# Force new deployment
aws ecs update-service --cluster feel-forward --service $SERVICE_NAME --force-new-deployment --region us-east-1
```

## Cost Optimization

- ECS Fargate costs ~$10-20/month for light usage
- Consider using Fargate Spot for dev environments
- Enable auto-scaling to reduce costs during low traffic

## Security Considerations

- Secrets stored in AWS Secrets Manager
- HTTPS only via ALB
- Security group restricts access
- Container runs as non-root user