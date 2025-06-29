#!/bin/bash
# SSL Certificate Setup Script for feelfwd.app
# This script creates and validates SSL certificates for the domain

set -e

# Configuration
DOMAIN="feelfwd.app"
REGION="us-east-1"
PROFILE="${AWS_PROFILE:-personal}"
HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"

echo "🔐 SSL Certificate Setup for ${DOMAIN}"
echo "=================================="

# Function to check if certificate already exists
check_existing_cert() {
    echo "Checking for existing certificates..."
    EXISTING_CERT=$(aws acm list-certificates \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query "CertificateSummaryList[?DomainName=='${DOMAIN}' && Status=='ISSUED'].CertificateArn" \
        --output text)
    
    if [ ! -z "${EXISTING_CERT}" ]; then
        echo "✅ Found existing certificate: ${EXISTING_CERT}"
        echo "${EXISTING_CERT}"
        return 0
    fi
    return 1
}

# Function to request new certificate
request_certificate() {
    echo "📝 Requesting new SSL certificate for ${DOMAIN} and *.${DOMAIN}..."
    
    CERT_ARN=$(aws acm request-certificate \
        --domain-name ${DOMAIN} \
        --subject-alternative-names "*.${DOMAIN}" \
        --validation-method DNS \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query 'CertificateArn' \
        --output text)
    
    echo "✅ Certificate requested: ${CERT_ARN}"
    echo "${CERT_ARN}"
}

# Function to add validation records
add_validation_records() {
    local cert_arn=$1
    echo "🔍 Getting validation records..."
    
    # Get validation records
    VALIDATION_RECORDS=$(aws acm describe-certificate \
        --certificate-arn ${cert_arn} \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
    
    RECORD_NAME=$(echo ${VALIDATION_RECORDS} | jq -r '.Name')
    RECORD_VALUE=$(echo ${VALIDATION_RECORDS} | jq -r '.Value')
    
    echo "📝 Adding validation record to Route53..."
    
    # Create change batch
    cat > /tmp/validation-change-batch.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${RECORD_NAME}",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "${RECORD_VALUE}"
          }
        ]
      }
    }
  ]
}
EOF
    
    # Apply the change
    CHANGE_ID=$(aws route53 change-resource-record-sets \
        --hosted-zone-id ${HOSTED_ZONE_ID} \
        --change-batch file:///tmp/validation-change-batch.json \
        --profile ${PROFILE} \
        --query 'ChangeInfo.Id' \
        --output text)
    
    echo "✅ Validation record added (Change ID: ${CHANGE_ID})"
    
    # Clean up
    rm -f /tmp/validation-change-batch.json
}

# Function to wait for certificate validation
wait_for_validation() {
    local cert_arn=$1
    echo "⏳ Waiting for certificate validation..."
    echo "   This typically takes 5-10 minutes..."
    
    local max_attempts=60
    local attempt=0
    
    while [ ${attempt} -lt ${max_attempts} ]; do
        STATUS=$(aws acm describe-certificate \
            --certificate-arn ${cert_arn} \
            --region ${REGION} \
            --profile ${PROFILE} \
            --query 'Certificate.Status' \
            --output text)
        
        if [ "${STATUS}" == "ISSUED" ]; then
            echo "✅ Certificate validated and issued!"
            return 0
        elif [ "${STATUS}" == "FAILED" ]; then
            echo "❌ Certificate validation failed!"
            return 1
        fi
        
        echo -n "."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ Timeout waiting for certificate validation"
    return 1
}

# Main execution
main() {
    # Check for existing certificate
    if CERT_ARN=$(check_existing_cert); then
        echo "Using existing certificate: ${CERT_ARN}"
        echo "${CERT_ARN}" > networking/ssl-certificate-arn.txt
        exit 0
    fi
    
    # Request new certificate
    CERT_ARN=$(request_certificate)
    
    # Add validation records
    add_validation_records "${CERT_ARN}"
    
    # Wait for validation
    if wait_for_validation "${CERT_ARN}"; then
        echo "🎉 SSL certificate setup complete!"
        echo "${CERT_ARN}" > networking/ssl-certificate-arn.txt
        echo "Certificate ARN saved to: networking/ssl-certificate-arn.txt"
    else
        echo "❌ SSL certificate setup failed"
        exit 1
    fi
}

# Run main function
main