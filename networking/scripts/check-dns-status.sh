#!/bin/bash

EXPECTED_NS=(
  "ns-1814.awsdns-34.co.uk"
  "ns-388.awsdns-48.com"
  "ns-708.awsdns-24.net"
  "ns-1271.awsdns-30.org"
)

echo '=== DNS Propagation & Certificate Check ==='

while true; do
  echo 'Checking NS records...'
  NS_RESULTS=$(dig +short NS feelfwd.app @8.8.8.8 | sort)

  echo "$NS_RESULTS"
  echo

  MATCHED=true
  for ns in "${EXPECTED_NS[@]}"; do
    if ! echo "$NS_RESULTS" | grep -q "$ns"; then
      MATCHED=false
      break
    fi
  done

  if [ "$MATCHED" = true ]; then
    echo "✅ All expected NS records found!"

    echo -e '\n=== Certificate Status ==='
    STATUS=$(aws acm describe-certificate \
      --certificate-arn arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88 \
      --region us-east-1 \
      --query 'Certificate.Status' \
      --output text \
      --profile personal)

    echo "Current certificate status: $STATUS"

    if [[ "$STATUS" == "ISSUED" ]]; then
      echo "✅ Certificate issued!"
      break
    else
      echo "ℹ️ NS records match, but certificate not issued yet. Retrying in 15s..."
    fi
  else
    echo "❌ NS records do not yet match. Retrying in 15s..."
  fi

  sleep 15
done

