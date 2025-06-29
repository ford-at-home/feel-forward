#!/bin/bash
# Quick deployment script with hardcoded values

set -euo pipefail

echo "🚀 Starting Feel Forward Frontend Deployment"

# Export required environment variables
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88"
export HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"
export AWS_PROFILE="personal"

# Check certificate status
echo "Checking certificate status..."
CERT_STATUS=$(aws acm describe-certificate --region us-east-1 \
    --certificate-arn "$CERTIFICATE_ARN" \
    --query "Certificate.Status" \
    --output text)

echo "Certificate status: $CERT_STATUS"

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "⚠️  Certificate is not yet validated (status: $CERT_STATUS)"
    echo "Please wait for certificate validation to complete."
    echo "This usually takes a few minutes after DNS records are added."
    exit 1
fi

echo "✅ Certificate is valid!"

# Save environment file
cat > .env.deploy << EOF
export CERTIFICATE_ARN="$CERTIFICATE_ARN"
export HOSTED_ZONE_ID="$HOSTED_ZONE_ID"
export DOMAIN="feelfwd.app"
EOF

echo "✅ Environment file created"

# Deploy frontend
echo "🏗️  Deploying frontend..."
cd ../frontend/infra

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing CDK dependencies..."
    npm install
fi

# Deploy the stack
echo "Deploying CDK stack..."
npx cdk deploy FeelFwdProdStack --require-approval never

echo "✅ Deployment complete!"

# Get CloudFront distribution info
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name FeelFwdProdStack \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
    --output text)

DISTRIBUTION_URL=$(aws cloudformation describe-stacks \
    --stack-name FeelFwdProdStack \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionUrl'].OutputValue" \
    --output text)

echo ""
echo "📋 Deployment Summary:"
echo "  - Domain: https://feelfwd.app"
echo "  - CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "  - CloudFront URL: $DISTRIBUTION_URL"
echo ""
echo "🔧 Next steps:"
echo "  1. Update nameservers at your domain registrar to:"
echo "     - ns-388.awsdns-48.com"
echo "     - ns-1814.awsdns-34.co.uk"
echo "     - ns-708.awsdns-24.net"
echo "     - ns-1271.awsdns-30.org"
echo "  2. Wait for DNS propagation (2-48 hours)"
echo "  3. Visit https://feelfwd.app"