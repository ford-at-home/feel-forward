#!/bin/bash
# Complete deployment script for Feel Forward
# This script deploys both frontend and backend infrastructure

set -e

echo "🚀 Feel Forward Complete Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOMAIN="feelfwd.app"
API_DOMAIN="api.${DOMAIN}"

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker not running${NC}"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 not found${NC}"
        exit 1
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        echo -e "${YELLOW}⚠️  CDK not found, installing...${NC}"
        npm install -g aws-cdk
    fi
    
    # Check environment variables
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${RED}❌ GITHUB_TOKEN not set${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo -e "\n${YELLOW}Deploying Backend...${NC}"
    
    cd "${PROJECT_ROOT}/backend"
    
    # Deploy infrastructure
    echo "Deploying backend infrastructure..."
    cd infra
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install -r requirements.txt
    
    cdk deploy BackendStack \
        -c domain=${DOMAIN} \
        -c apiDomain=${API_DOMAIN} \
        --require-approval never \
        --outputs-file outputs.json
    
    # Extract outputs
    ECR_URI=$(jq -r '.BackendStack.RepositoryUri' outputs.json)
    CLUSTER_NAME=$(jq -r '.BackendStack.ClusterName' outputs.json)
    SERVICE_NAME=$(jq -r '.BackendStack.ServiceName' outputs.json)
    
    deactivate
    cd ..
    
    # Build and push Docker image
    echo "Building Docker image..."
    docker build -t feel-forward .
    
    echo "Pushing to ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${ECR_URI%/*}
    
    docker tag feel-forward:latest ${ECR_URI}:latest
    docker push ${ECR_URI}:latest
    
    # Scale up service
    echo "Scaling up ECS service..."
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --desired-count 1 \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✅ Backend deployed${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "\n${YELLOW}Deploying Frontend...${NC}"
    
    cd "${PROJECT_ROOT}/frontend"
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build frontend
    echo "Building frontend..."
    npm run build:production
    
    # Deploy infrastructure
    echo "Deploying frontend infrastructure..."
    cd infra
    npm install
    cdk deploy FeelFwdWebsiteStack-prod \
        -c domainName=${DOMAIN} \
        --require-approval never \
        --outputs-file outputs.json
    
    # Extract outputs
    BUCKET_NAME=$(jq -r '.["FeelFwdWebsiteStack-prod"].WebsiteBucketName' outputs.json)
    DISTRIBUTION_ID=$(jq -r '.["FeelFwdWebsiteStack-prod"].DistributionId' outputs.json)
    
    cd ..
    
    # Upload to S3
    echo "Uploading to S3..."
    aws s3 sync dist/ s3://${BUCKET_NAME} \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "index.html" \
        --exclude "*.json"
    
    aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
        --cache-control "no-cache, no-store, must-revalidate"
    
    # Invalidate CloudFront
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id ${DISTRIBUTION_ID} \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text
    
    echo -e "${GREEN}✅ Frontend deployed${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "\n${YELLOW}Verifying deployment...${NC}"
    
    # Wait a bit for DNS propagation
    echo "Waiting for services to stabilize..."
    sleep 30
    
    # Check frontend
    echo -n "Checking frontend (https://${DOMAIN})... "
    if curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN} | grep -q "200"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Check API
    echo -n "Checking API (https://${API_DOMAIN}/health)... "
    if curl -s https://${API_DOMAIN}/health | grep -q "ok"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    echo -e "\n${GREEN}Deployment Summary:${NC}"
    echo "Frontend: https://${DOMAIN}"
    echo "API: https://${API_DOMAIN}"
    echo "API Docs: https://${API_DOMAIN}/docs"
}

# Main execution
main() {
    echo "Starting deployment at $(date)"
    
    check_prerequisites
    
    # Load environment variables
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
    fi
    
    # Deploy based on arguments
    case "${1:-all}" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            deploy_frontend
            verify_deployment
            ;;
        *)
            echo "Usage: $0 [backend|frontend|all]"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}Deployment completed at $(date)${NC}"
}

# Run main function
main "$@"