# Infrastructure

This folder contains an AWS CDK app that provisions the DNS records and static hosting for the Feel Forward frontend.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.12+

## Deploy

```bash
cd infra
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cdk deploy \
  -c domain=feelfwd.app \
  -c apiDomain=api.feelfwd.app
```

After deployment, upload the built frontend assets to the S3 bucket printed in the stack outputs. CloudFront will serve the site at `https://feelfwd.app`.
