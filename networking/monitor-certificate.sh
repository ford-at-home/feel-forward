#!/bin/bash

# Monitor SSL Certificate Validation Status
CERT_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f99bffe5-6671-47be-82be-60f8b4c9db31"
REGION="us-east-1"
PROFILE="personal"

echo "Monitoring certificate validation status..."
echo "Certificate ARN: $CERT_ARN"
echo ""

while true; do
    STATUS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region "$REGION" \
        --profile "$PROFILE" \
        --query "Certificate.Status" \
        --output text)
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] Status: $STATUS"
    
    if [ "$STATUS" = "ISSUED" ]; then
        echo ""
        echo "✅ Certificate is now validated and issued!"
        echo "You can now proceed with the deployment."
        break
    elif [ "$STATUS" != "PENDING_VALIDATION" ]; then
        echo ""
        echo "⚠️  Unexpected status: $STATUS"
        break
    fi
    
    sleep 30
done