# Frontend Integration Guide

This document explains how to connect the React frontend at **feelfwd.app** to the Feel Forward backend deployed on AWS.
This project relies on an AI automation agent to build and deploy the frontend. A human collaborator manages the domain and DNS configuration. Follow the steps below to keep the environment in sync.

## Current Backend Deployment Status

**✅ BACKEND IS DEPLOYED AND READY**

- **Region:** us-east-1 (AWS)
- **API Base URL:** `https://api.feelfwd.app`
- **Health Check:** `https://api.feelfwd.app/health`
- **Deployment Date:** June 10, 2025
- **Status:** Fully operational with Docker image pushed to ECR

## Backend Configuration for Frontend AI Agent

### What to Expect When Configuring

1. **API Endpoints Available:**
   - `POST /phase0/factors` - Initial factors assessment
   - `POST /phase1/preferences` - User preferences collection
   - `POST /phase2/scenarios` - Scenario generation
   - `POST /phase3/reactions` - User reactions processing
   - `POST /phase4/summary` - Final summary generation
   - `GET /health` - Health check endpoint

2. **CORS Configuration:**
   - Backend is configured to accept requests from:
     - `https://feelfwd.app`
     - `https://www.feelfwd.app`
   - No additional CORS configuration needed

3. **Authentication:**
   - No authentication required for API endpoints
   - OpenAI API key is managed server-side via AWS Secrets Manager

4. **Rate Limiting:**
   - Requests exceeding rate limits return HTTP 429
   - Implement appropriate retry logic in frontend

### Frontend Environment Configuration

Create a `.env` file inside `frontend/` with:

```bash
VITE_API_URL=https://api.feelfwd.app
```

Use `import.meta.env.VITE_API_URL` when making API calls from the frontend.

### Expected API Response Format

All endpoints return JSON with the following structure:
```json
{
  "status": "success",
  "data": { /* endpoint-specific data */ },
  "message": "Optional message"
}
```

### Troubleshooting for Frontend AI Agent

**If API calls fail:**

1. **DNS Issues:** 
   - Domain: `api.feelfwd.app`
   - DNS propagation can take 5-15 minutes
   - Test with: `curl https://api.feelfwd.app/health`

2. **CORS Errors:**
   - Ensure frontend is served from `https://feelfwd.app` or `https://www.feelfwd.app`
   - Check browser console for CORS error details

3. **Connection Timeouts:**
   - Backend is deployed on ECS Fargate with auto-scaling
   - Cold starts may take 10-30 seconds for first request
   - Implement appropriate loading states

4. **Health Check:**
   - Always test `/health` endpoint first
   - Expected response: `{"status": "healthy"}`

## Overview

- Frontend code lives in the `frontend/` directory (React + Vite).
- Backend API is provided by this repository via FastAPI.
- Requests should be sent to `https://api.feelfwd.app`.

## DNS and Route 53

All DNS resources can be provisioned automatically with the [AWS CDK](./infra). The stack creates a Route 53 hosted zone, CloudFront distribution, and records for the API.

```bash
cd infra
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cdk deploy -c domain=feelfwd.app -c apiDomain=api.feelfwd.app
```

If you already registered the domain, the CDK stack will output name servers to configure with your registrar. No additional manual records are needed.

Ensure the backend allows CORS from `https://feelfwd.app` and `https://www.feelfwd.app`.

## Automation

The AI agent runs the CDK deployment and uploads the latest build to the hosting bucket. The human maintains DNS records and verifies that the domain points to the CloudFront distribution.

## Build & Deploy

1. `cd frontend`
2. `npm install`
3. `npm run build`
4. Upload the `dist/` folder to your static hosting provider (S3 + CloudFront or similar).

After deployment, verify that requests from `https://feelfwd.app` reach `https://api.feelfwd.app` without CORS errors.

## Testing Checklist for Frontend AI Agent

- [ ] Health check endpoint responds: `curl https://api.feelfwd.app/health`
- [ ] CORS headers are present for frontend domain
- [ ] All 5 phase endpoints return expected JSON structure
- [ ] Frontend environment variable `VITE_API_URL` is set correctly
- [ ] API calls from frontend work without errors
- [ ] Loading states handle potential cold start delays
- [ ] Error handling for rate limits (HTTP 429) is implemented
