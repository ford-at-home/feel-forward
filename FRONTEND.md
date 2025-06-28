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

## Demo and Testing Features

### Interactive CLI Demo
The backend includes a comprehensive interactive demo system that showcases the complete Feel Forward workflow:

#### Available Demo Commands
```bash
# Launch demo (auto-detects interactive vs non-interactive)
make demo

# Force interactive mode (requires terminal)
python demo_interactive.py

# Non-interactive demo with preset inputs
python demo_quick.py

# Session management
make sessions              # Show session management help
make sessions-list         # List all saved sessions
make sessions-clean        # Clean old session files
make sessions-export       # Export session summary to markdown
make sessions-stats        # Show session statistics
```

#### Demo Features
- **Session Resume**: Load and continue from previous sessions
- **Auto-save**: Progress is automatically saved on interruption
- **Export Options**: 
  - JSON session files with complete data
  - Formatted markdown reports for sharing
- **Error Recovery**: Graceful handling of invalid inputs
- **Progress Tracking**: Visual indicators and phase completion status

#### Session File Format
Demo sessions are saved as JSON with this structure:
```json
{
  "version": "1.0",
  "timestamp": "2025-06-28T20:30:00.000Z",
  "topic": "choosing a job",
  "factors": [...],
  "preferences": [...],
  "scenarios": [...], 
  "reactions": [...],
  "insights": "...",
  "summary": {
    "total_factors": 12,
    "preferences_count": 4,
    "scenarios_count": 4,
    "reactions_count": 4
  }
}
```

### Frontend Integration Guidance

When building the frontend, you can reference the demo implementation for:

#### 1. **User Flow Design**
- The CLI demo shows the optimal user experience flow
- Each phase builds logically on the previous one
- Clear progress indicators and phase transitions
- Graceful error handling and input validation

#### 2. **Data Flow Patterns**
- How preferences are enriched with importance and limits
- How scenarios test user preferences through trade-offs
- How emotional reactions are captured and analyzed
- How insights synthesize patterns from all previous phases

#### 3. **State Management**
- Session persistence and resume functionality
- Phase completion tracking
- Auto-save capabilities for long sessions
- Export functionality for sharing results

#### 4. **UI/UX Inspiration**
- Visual representation of importance scales (1-10)
- Emotional response interfaces (excitement/anxiety sliders)
- Scenario presentation with clear calls-to-action
- Progress visualization and phase navigation

#### 5. **Error Handling**
- Input validation patterns
- Graceful degradation when API is unavailable
- User-friendly error messages
- Recovery and retry mechanisms

### Testing Integration

The demo system can be used to:
- **Validate API Integration**: Test all endpoints with realistic data
- **Generate Test Data**: Create session files for frontend testing
- **User Acceptance Testing**: Let stakeholders experience the full workflow
- **Performance Testing**: Understand typical session lengths and data sizes

### Frontend Implementation Notes

When building the React frontend:

1. **Session Management**: Consider implementing similar session save/resume functionality
2. **Progress Indicators**: Show users where they are in the 5-phase process
3. **Data Visualization**: Use the demo's emotional pattern analysis as inspiration
4. **Export Features**: Allow users to download their insights as PDF/markdown
5. **Responsive Design**: Ensure the workflow works well on mobile devices
6. **Accessibility**: Make emotional response inputs accessible for all users

## Testing Checklist for Frontend AI Agent

- [ ] Health check endpoint responds: `curl https://api.feelfwd.app/health`
- [ ] CORS headers are present for frontend domain
- [ ] All 5 phase endpoints return expected JSON structure
- [ ] Frontend environment variable `VITE_API_URL` is set correctly
- [ ] API calls from frontend work without errors
- [ ] Loading states handle potential cold start delays
- [ ] Error handling for rate limits (HTTP 429) is implemented
- [ ] Run `make demo` to experience the complete workflow
- [ ] Test session save/resume functionality if implemented
- [ ] Verify emotional response interfaces are intuitive
- [ ] Test export functionality for sharing insights
