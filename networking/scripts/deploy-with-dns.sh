#!/bin/bash
set -euo pipefail

# ============================================================================
# Feel Forward Complete DNS & Deployment Script
# This script automates DNS setup verification and deployment
# ============================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="feelfwd.app"
AWS_REGION="us-east-1"
CERTIFICATE_ARN="${CERTIFICATE_ARN:-}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"
ENV_FILE=".env.deploy"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS CLI configured for account: $ACCOUNT_ID"
}

# Function to check Route53 hosted zone
check_hosted_zone() {
    print_status "Checking for Route53 hosted zone for $DOMAIN..."
    
    ZONE_INFO=$(aws route53 list-hosted-zones-by-name \
        --query "HostedZones[?Name=='${DOMAIN}.'].{Id:Id,Name:Name}" \
        --output json)
    
    if [ "$(echo "$ZONE_INFO" | jq -r '. | length')" -eq 0 ]; then
        print_warning "No hosted zone found for $DOMAIN"
        return 1
    fi
    
    HOSTED_ZONE_ID=$(echo "$ZONE_INFO" | jq -r '.[0].Id' | cut -d'/' -f3)
    print_success "Found hosted zone: $HOSTED_ZONE_ID"
    
    # Get name servers
    NS_RECORDS=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --query "ResourceRecordSets[?Type=='NS' && Name=='${DOMAIN}.'].ResourceRecords[].Value" \
        --output json | jq -r '.[]')
    
    echo
    print_status "Name servers for $DOMAIN:"
    echo "$NS_RECORDS" | while read -r ns; do
        echo "  - $ns"
    done
    echo
    
    return 0
}

# Function to check SSL certificate
check_certificate() {
    print_status "Checking for SSL certificate in ACM (us-east-1)..."
    
    CERT_INFO=$(aws acm list-certificates --region us-east-1 \
        --query "CertificateSummaryList[?DomainName=='${DOMAIN}' || DomainName=='*.${DOMAIN}'].CertificateArn" \
        --output json)
    
    if [ "$(echo "$CERT_INFO" | jq -r '. | length')" -eq 0 ]; then
        print_warning "No certificate found for $DOMAIN"
        return 1
    fi
    
    # Get the first valid certificate
    for cert_arn in $(echo "$CERT_INFO" | jq -r '.[]'); do
        CERT_STATUS=$(aws acm describe-certificate --region us-east-1 \
            --certificate-arn "$cert_arn" \
            --query "Certificate.Status" \
            --output text)
        
        if [ "$CERT_STATUS" = "ISSUED" ]; then
            CERTIFICATE_ARN="$cert_arn"
            print_success "Found valid certificate: $CERTIFICATE_ARN"
            
            # Show certificate details
            CERT_DETAILS=$(aws acm describe-certificate --region us-east-1 \
                --certificate-arn "$cert_arn" \
                --query "Certificate.{DomainName:DomainName,SubjectAlternativeNames:SubjectAlternativeNames}" \
                --output json)
            
            print_status "Certificate covers domains:"
            echo "$CERT_DETAILS" | jq -r '.SubjectAlternativeNames[]' | while read -r domain; do
                echo "  - $domain"
            done
            
            return 0
        fi
    done
    
    print_warning "No valid (ISSUED) certificate found"
    return 1
}

# Function to create certificate if needed
create_certificate() {
    print_status "Creating new SSL certificate for $DOMAIN..."
    
    CERT_ARN=$(aws acm request-certificate --region us-east-1 \
        --domain-name "$DOMAIN" \
        --subject-alternative-names "*.${DOMAIN}" \
        --validation-method DNS \
        --query CertificateArn \
        --output text)
    
    print_success "Certificate requested: $CERT_ARN"
    print_warning "You need to validate this certificate by adding DNS records."
    print_status "Waiting for validation records to be available..."
    
    sleep 10
    
    # Get validation records
    VALIDATION_RECORDS=$(aws acm describe-certificate --region us-east-1 \
        --certificate-arn "$CERT_ARN" \
        --query "Certificate.DomainValidationOptions[*].ResourceRecord" \
        --output json)
    
    print_status "Add these CNAME records to your DNS:"
    echo "$VALIDATION_RECORDS" | jq -r '.[] | "  \(.Name) -> \(.Value)"'
    
    CERTIFICATE_ARN="$CERT_ARN"
}

# Function to save environment variables
save_env_file() {
    print_status "Saving configuration to $ENV_FILE..."
    
    cat > "$ENV_FILE" << EOF
# Generated by deploy-with-dns.sh on $(date)
export CERTIFICATE_ARN="$CERTIFICATE_ARN"
export HOSTED_ZONE_ID="$HOSTED_ZONE_ID"
export DOMAIN="$DOMAIN"
EOF
    
    print_success "Environment file created: $ENV_FILE"
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend with CDK..."
    
    # Source environment variables
    source "$ENV_FILE"
    
    # Change to frontend directory
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    print_status "Building frontend..."
    npm run build
    
    # Deploy with CDK
    cd infra
    
    # Install CDK dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing CDK dependencies..."
        npm install
    fi
    
    # Bootstrap CDK if needed
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
        print_status "Bootstrapping CDK..."
        npx cdk bootstrap
    fi
    
    # Deploy production stack
    print_status "Deploying production stack..."
    CERTIFICATE_ARN="$CERTIFICATE_ARN" \
    HOSTED_ZONE_ID="$HOSTED_ZONE_ID" \
    npx cdk deploy FeelFwdProdStack --require-approval never
    
    # Get CloudFront distribution ID
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name FeelFwdProdStack \
        --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
        --output text)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        print_status "Creating CloudFront invalidation..."
        aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*" \
            --query "Invalidation.Id" \
            --output text
    fi
    
    cd ../..
}

# Function to show final instructions
show_final_instructions() {
    echo
    echo "============================================================================"
    print_success "Deployment Complete!"
    echo "============================================================================"
    echo
    
    if [ -f "$ENV_FILE" ]; then
        print_status "Configuration saved to: $ENV_FILE"
        echo
    fi
    
    print_status "🔧 MANUAL STEPS REQUIRED:"
    echo
    echo "1. Update your domain registrar's nameservers to:"
    
    if [ -n "$HOSTED_ZONE_ID" ]; then
        aws route53 list-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --query "ResourceRecordSets[?Type=='NS' && Name=='${DOMAIN}.'].ResourceRecords[].Value" \
            --output text | while read -r ns; do
            echo "   - ${ns%.}"
        done
    fi
    
    echo
    echo "2. Wait for DNS propagation (can take up to 48 hours)"
    echo
    echo "3. Verify your sites are working:"
    echo "   - https://feelfwd.app"
    echo "   - https://www.feelfwd.app"
    echo "   - https://api.feelfwd.app"
    echo
    
    print_status "📋 What can be automated:"
    echo "   ✅ Route53 hosted zone verification"
    echo "   ✅ SSL certificate creation/verification"
    echo "   ✅ CDK deployment with DNS configuration"
    echo "   ✅ CloudFront distribution setup"
    echo "   ✅ Route53 record creation"
    echo
    
    print_status "📋 What CANNOT be automated:"
    echo "   ❌ Updating nameservers at your domain registrar"
    echo "   ❌ DNS propagation time"
    echo "   ❌ Certificate validation (if using email validation)"
    echo
}

# Main execution
main() {
    print_status "Starting Feel Forward DNS & Deployment Setup"
    echo "============================================================================"
    
    # Check prerequisites
    check_aws_cli
    
    # Check or get hosted zone
    if ! check_hosted_zone; then
        print_error "No hosted zone found. Please ensure backend stack is deployed first."
        print_status "Run: cd backend && cdk deploy"
        exit 1
    fi
    
    # Check or create certificate
    if ! check_certificate; then
        print_warning "No valid certificate found."
        read -p "Create a new certificate? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_certificate
        else
            print_error "Certificate is required for HTTPS. Exiting."
            exit 1
        fi
    fi
    
    # Save configuration
    save_env_file
    
    # Deploy frontend
    read -p "Deploy frontend now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_frontend
    else
        print_status "Skipping deployment. To deploy later, run:"
        echo "  source $ENV_FILE"
        echo "  cd frontend && ./scripts/deploy.sh prod"
    fi
    
    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"