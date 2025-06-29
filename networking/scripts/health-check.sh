#!/bin/bash
# Health check script for Feel Forward services
# Verifies all components are functioning correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="feelfwd.app"
API_DOMAIN="api.${DOMAIN}"
TIMEOUT=10

echo "🏥 Feel Forward Health Check"
echo "==========================="
echo "Timestamp: $(date)"
echo ""

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local expected_code=$2
    local description=$3
    
    echo -n "Checking ${description}... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} "${url}" || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ OK (${response})${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (${response})${NC}"
        return 1
    fi
}

# Function to check DNS resolution
check_dns() {
    local domain=$1
    local description=$2
    
    echo -n "Checking DNS for ${description}... "
    
    if nslookup "${domain}" > /dev/null 2>&1; then
        ip=$(dig +short "${domain}" | head -n1)
        echo -e "${GREEN}✅ OK (${ip})${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    local description=$2
    
    echo -n "Checking SSL for ${description}... "
    
    cert_info=$(echo | openssl s_client -servername "${domain}" -connect "${domain}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        echo -e "${GREEN}✅ OK (expires: ${expiry})${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to check API functionality
check_api_endpoint() {
    local endpoint=$1
    local method=$2
    local description=$3
    
    echo -n "Checking API ${description}... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s --max-time ${TIMEOUT} "${endpoint}" 2>/dev/null)
    else
        response=$(curl -s -X ${method} --max-time ${TIMEOUT} "${endpoint}" -H "Content-Type: application/json" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to check AWS services
check_aws_service() {
    local service=$1
    local resource=$2
    local description=$3
    
    echo -n "Checking AWS ${description}... "
    
    case $service in
        ecs)
            result=$(aws ecs describe-services --cluster feel-forward --services ${resource} --query 'services[0].runningCount' --output text 2>/dev/null)
            if [ "$result" -gt 0 ] 2>/dev/null; then
                echo -e "${GREEN}✅ OK (${result} tasks)${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL${NC}"
                return 1
            fi
            ;;
        cloudfront)
            status=$(aws cloudfront get-distribution --id ${resource} --query 'Distribution.Status' --output text 2>/dev/null)
            if [ "$status" = "Deployed" ]; then
                echo -e "${GREEN}✅ OK${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL (${status})${NC}"
                return 1
            fi
            ;;
    esac
}

# Main health checks
main() {
    local errors=0
    
    echo "🌐 DNS Resolution"
    echo "-----------------"
    check_dns "${DOMAIN}" "Frontend domain" || ((errors++))
    check_dns "www.${DOMAIN}" "WWW domain" || ((errors++))
    check_dns "${API_DOMAIN}" "API domain" || ((errors++))
    
    echo ""
    echo "🔒 SSL Certificates"
    echo "-------------------"
    check_ssl "${DOMAIN}" "Frontend" || ((errors++))
    check_ssl "${API_DOMAIN}" "API" || ((errors++))
    
    echo ""
    echo "🌍 HTTP Endpoints"
    echo "-----------------"
    check_http "https://${DOMAIN}" "200" "Frontend homepage" || ((errors++))
    check_http "https://www.${DOMAIN}" "200" "WWW redirect" || ((errors++))
    check_http "https://${API_DOMAIN}/health" "200" "API health" || ((errors++))
    check_http "https://${API_DOMAIN}/docs" "200" "API documentation" || ((errors++))
    
    echo ""
    echo "🔧 API Functionality"
    echo "--------------------"
    check_api_endpoint "https://${API_DOMAIN}/openapi.json" "GET" "OpenAPI schema" || ((errors++))
    
    # Check if AWS CLI is configured
    if command -v aws &> /dev/null && aws sts get-caller-identity &> /dev/null; then
        echo ""
        echo "☁️  AWS Services"
        echo "----------------"
        
        # Get service name
        SERVICE_NAME=$(aws ecs list-services --cluster feel-forward --query 'serviceArns[0]' --output text 2>/dev/null | cut -d'/' -f3)
        if [ -n "$SERVICE_NAME" ]; then
            check_aws_service "ecs" "${SERVICE_NAME}" "ECS Service" || ((errors++))
        fi
        
        # Get CloudFront distribution ID
        DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, '${DOMAIN}')].Id" --output text 2>/dev/null)
        if [ -n "$DIST_ID" ]; then
            check_aws_service "cloudfront" "${DIST_ID}" "CloudFront" || ((errors++))
        fi
    fi
    
    echo ""
    echo "📊 Summary"
    echo "----------"
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed!${NC}"
        echo "Feel Forward is fully operational."
    else
        echo -e "${RED}❌ ${errors} checks failed${NC}"
        echo "Please investigate the failures above."
        exit 1
    fi
    
    echo ""
    echo "🔗 Quick Links:"
    echo "- Frontend: https://${DOMAIN}"
    echo "- API: https://${API_DOMAIN}"
    echo "- API Docs: https://${API_DOMAIN}/docs"
}

# Run main function
main