#!/bin/bash

# FeelFwd Deployment Script
# Usage: ./scripts/deploy.sh [staging|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
STAGE=${1:-staging}
SKIP_BUILD=${SKIP_BUILD:-false}
SKIP_TESTS=${SKIP_TESTS:-false}

# Function to print colored output
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

# Validate stage
if [[ "$STAGE" != "staging" && "$STAGE" != "prod" ]]; then
    print_error "Invalid stage: $STAGE. Must be 'staging' or 'prod'"
    exit 1
fi

print_status "Starting deployment to $STAGE environment..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check for required environment variables
if [[ "$STAGE" == "prod" ]]; then
    if [[ -z "$CERTIFICATE_ARN" || -z "$HOSTED_ZONE_ID" ]]; then
        print_warning "CERTIFICATE_ARN and HOSTED_ZONE_ID environment variables are recommended for production deployment"
    fi
fi

# Install dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    print_status "Installing dependencies..."
    npm ci
fi

# Run tests unless skipped
if [[ "$SKIP_TESTS" != "true" ]]; then
    print_status "Running tests..."
    npm run lint
    # Add npm test when tests are available
    # npm test
else
    print_warning "Skipping tests (SKIP_TESTS=true)"
fi

# Build the application unless skipped
if [[ "$SKIP_BUILD" != "true" ]]; then
    print_status "Building application for $STAGE..."
    if [[ "$STAGE" == "prod" ]]; then
        npm run build
    else
        npm run build:dev
    fi
    print_success "Build completed successfully"
else
    print_warning "Skipping build (SKIP_BUILD=true)"
    if [[ ! -d "dist" ]]; then
        print_error "dist/ directory not found and build was skipped. Please build first."
        exit 1
    fi
fi

# Install CDK dependencies
print_status "Installing CDK dependencies..."
cd infra
if [[ ! -d "node_modules" ]]; then
    npm ci
fi

# Deploy infrastructure
print_status "Deploying infrastructure to $STAGE..."
if [[ "$STAGE" == "prod" ]]; then
    npm run deploy:prod
else
    npm run deploy:staging
fi

# Get stack outputs
print_status "Retrieving deployment information..."
STACK_NAME="FeelFwd${STAGE^}Stack"
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text 2>/dev/null || echo "")
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text 2>/dev/null || echo "")
WEBSITE_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" --output text 2>/dev/null || echo "")

if [[ -z "$BUCKET_NAME" ]]; then
    print_error "Could not retrieve bucket name from CloudFormation stack"
    exit 1
fi

# Sync files to S3
print_status "Uploading files to S3 bucket: $BUCKET_NAME"
cd ..
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --exact-timestamps

# Invalidate CloudFront cache
if [[ -n "$DISTRIBUTION_ID" ]]; then
    print_status "Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --query "Invalidation.Id" --output text)
    print_status "Invalidation created with ID: $INVALIDATION_ID"
    
    # Wait for invalidation to complete (optional)
    if [[ "${WAIT_FOR_INVALIDATION:-false}" == "true" ]]; then
        print_status "Waiting for invalidation to complete..."
        aws cloudfront wait invalidation-completed --distribution-id "$DISTRIBUTION_ID" --id "$INVALIDATION_ID"
        print_success "Invalidation completed"
    fi
else
    print_warning "Could not retrieve CloudFront distribution ID - skipping cache invalidation"
fi

# Print deployment summary
print_success "Deployment to $STAGE completed successfully!"
echo ""
echo "Deployment Summary:"
echo "==================="
echo "Stage: $STAGE"
echo "S3 Bucket: $BUCKET_NAME"
if [[ -n "$DISTRIBUTION_ID" ]]; then
    echo "CloudFront Distribution: $DISTRIBUTION_ID"
fi
if [[ -n "$WEBSITE_URL" ]]; then
    echo "Website URL: $WEBSITE_URL"
fi
echo ""
print_status "Your application is now deployed and accessible!"