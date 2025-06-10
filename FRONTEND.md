# Frontend Integration Guide

This document explains how to connect the React frontend at **feelfwd.app** to the Feel Forward backend deployed on AWS.

## Overview

- Frontend code lives in the `frontend/` directory (React + Vite).
- Backend API is provided by this repository via FastAPI.
- Requests should be sent to `https://api.feelfwd.app`.

## DNS and Route 53

All DNS resources can be provisioned automatically with the [AWS CDK](./infra). The stack creates a Route 53 hosted zone, CloudFront distribution, and records for the API.

```bash
cd infra
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cdk deploy -c domain=feelfwd.app -c apiDomain=api.feelfwd.app
```

If you already registered the domain, the CDK stack will output name servers to configure with your registrar. No additional manual records are needed.

Ensure the backend allows CORS from `https://feelfwd.app` and `https://www.feelfwd.app`.

## Frontend Environment

Create a `.env` file inside `frontend/` with:

```bash
VITE_API_URL=https://api.feelfwd.app
```

Use `import.meta.env.VITE_API_URL` when making API calls from the frontend.

## Lovable Automation Agent

"Lovable" is the name of the automation agent responsible for provisioning and maintaining the front‑end stack. It runs the CDK deployment and uploads the latest build to CloudFront.

The frontend application itself does **not** introduce Lovable as a user‑facing character. Instead, Lovable is an internal helper that ensures infrastructure and deployment remain automated.

## Build & Deploy

1. `cd frontend`
2. `npm install`
3. `npm run build`
4. Upload the `dist/` folder to your static hosting provider (S3 + CloudFront or similar).

After deployment, verify that requests from `https://feelfwd.app` reach `https://api.feelfwd.app` without CORS errors.
