#!/bin/bash

# FeelFwd Bootstrap Script
# This script sets up the initial deployment environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Bootstrapping FeelFwd deployment environment..."

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or later is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install AWS CLI first."
    echo "Installation instructions: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

print_success "AWS CLI version: $(aws --version)"

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS Account ID: $ACCOUNT_ID"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm ci

# Install CDK dependencies
print_status "Installing CDK dependencies..."
cd infra
npm ci

# Check if CDK is installed globally
if ! command -v cdk &> /dev/null; then
    print_warning "AWS CDK CLI not found globally. Installing locally..."
    npm install -g aws-cdk
fi

print_success "CDK version: $(cdk --version)"

# Bootstrap CDK (if not already done)
print_status "Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit >/dev/null 2>&1; then
    print_status "CDK not bootstrapped. Running CDK bootstrap..."
    cdk bootstrap
    print_success "CDK bootstrap completed"
else
    print_success "CDK already bootstrapped"
fi

cd ..

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local from template..."
    cp .env.example .env.local
    print_warning "Please edit .env.local with your configuration"
fi

# Run domain setup
print_status "Running domain setup..."
./scripts/setup-domain.sh

print_success "Bootstrap completed successfully!"
echo ""
echo "Next steps:"
echo "==========="
echo "1. Review and edit .env.local with your configuration"
echo "2. Review and edit .env.deploy with your AWS settings"
echo "3. Test the build: npm run build:prod"
echo "4. Deploy to staging: npm run deploy:staging"
echo "5. Deploy to production: npm run deploy:prod"
echo ""
print_status "Your deployment environment is now ready!"