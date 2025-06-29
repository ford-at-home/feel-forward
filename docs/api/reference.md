# API Reference

Complete API reference for the Feel Forward backend service.

## Base URL

Production: `https://api.feelfwd.app`
Local Development: `http://localhost:8000`

## Authentication

Currently, the API does not require authentication. Future versions may implement JWT-based authentication.

## Rate Limiting

All endpoints are rate limited to 60 requests per minute per IP address. Exceeding this limit will result in a 429 status code.

## Common Headers

```http
Content-Type: application/json
Accept: application/json
```

## Endpoints

### Health Check

```http
GET /health
```

Check if the API is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-06-29T12:00:00Z"
}
```

### Phase 0: Factor Discovery

```http
POST /phase0/factors
```

Discover key factors that influence the user's decision.

**Request Body:**
```json
{
  "decision_context": "string",
  "user_background": "string (optional)"
}
```

**Response:**
```json
{
  "factors": [
    {
      "name": "string",
      "description": "string",
      "importance": "high|medium|low",
      "category": "string (optional)"
    }
  ],
  "follow_up_questions": ["string"],
  "insights": "string (optional)"
}
```

**Example:**
```bash
curl -X POST https://api.feelfwd.app/phase0/factors \
  -H "Content-Type: application/json" \
  -d '{
    "decision_context": "Choosing between job offers in San Francisco and Austin"
  }'
```

### Phase 1: Preference Detailing

```http
POST /phase1/preferences
```

Detail user preferences and priorities for the identified factors.

**Request Body:**
```json
{
  "factors": [
    {
      "name": "string",
      "description": "string",
      "importance": "high|medium|low"
    }
  ],
  "user_preferences": "string",
  "constraints": ["string"] 
}
```

**Response:**
```json
{
  "preferences": [
    {
      "factor": "string",
      "preference": "string",
      "priority": 1-10,
      "reasoning": "string"
    }
  ],
  "trade_offs": [
    {
      "between": ["factor1", "factor2"],
      "preference": "string",
      "conditions": "string"
    }
  ],
  "clarifying_questions": ["string"]
}
```

### Phase 2: Scenario Generation

```http
POST /phase2/scenarios
```

Generate realistic decision scenarios based on preferences.

**Request Body:**
```json
{
  "preferences": [
    {
      "factor": "string",
      "preference": "string",
      "priority": 1-10
    }
  ],
  "trade_offs": [
    {
      "between": ["string"],
      "preference": "string"
    }
  ],
  "num_scenarios": 3-5
}
```

**Response:**
```json
{
  "scenarios": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "factors": {
        "factor_name": {
          "value": "string",
          "rating": 1-10
        }
      },
      "pros": ["string"],
      "cons": ["string"],
      "emotional_tone": "string"
    }
  ],
  "comparison_framework": "string"
}
```

### Phase 3: Emotional Calibration

```http
POST /phase3/reactions
```

Capture and analyze emotional responses to scenarios.

**Request Body:**
```json
{
  "scenarios": [
    {
      "id": "string",
      "title": "string"
    }
  ],
  "reactions": [
    {
      "scenario_id": "string",
      "emotional_response": "string",
      "intensity": 1-10,
      "initial_thoughts": "string",
      "concerns": ["string"],
      "excitement_factors": ["string"]
    }
  ]
}
```

**Response:**
```json
{
  "patterns": [
    {
      "type": "string",
      "description": "string",
      "scenarios_affected": ["string"],
      "significance": "high|medium|low"
    }
  ],
  "emotional_profile": {
    "primary_motivators": ["string"],
    "primary_concerns": ["string"],
    "decision_style": "string"
  },
  "inconsistencies": [
    {
      "description": "string",
      "scenarios": ["string"],
      "suggestion": "string"
    }
  ]
}
```

### Phase 4: Insight Synthesis

```http
POST /phase4/summary
```

Synthesize all previous phases into actionable insights.

**Request Body:**
```json
{
  "phase0_data": { /* Phase 0 response */ },
  "phase1_data": { /* Phase 1 response */ },
  "phase2_data": { /* Phase 2 response */ },
  "phase3_data": { /* Phase 3 response */ },
  "additional_context": "string (optional)"
}
```

**Response:**
```json
{
  "key_insights": [
    {
      "insight": "string",
      "confidence": "high|medium|low",
      "supporting_evidence": ["string"]
    }
  ],
  "recommendations": [
    {
      "recommendation": "string",
      "rationale": "string",
      "action_steps": ["string"],
      "potential_challenges": ["string"]
    }
  ],
  "decision_framework": {
    "top_priorities": ["string"],
    "deal_breakers": ["string"],
    "compromise_areas": ["string"]
  },
  "next_steps": ["string"],
  "reflection_questions": ["string"]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Specific validation error message"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "request_id": "uuid"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service temporarily unavailable",
  "retry_after": 30
}
```

## Response Headers

All responses include:
- `X-Request-ID`: Unique request identifier for tracking
- `X-RateLimit-Limit`: Rate limit ceiling
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when rate limit resets

## SDK Examples

### Python
```python
import requests

API_BASE = "https://api.feelfwd.app"

# Phase 0
response = requests.post(
    f"{API_BASE}/phase0/factors",
    json={"decision_context": "Career change decision"}
)
factors = response.json()
```

### JavaScript/TypeScript
```typescript
const API_BASE = "https://api.feelfwd.app";

// Phase 0
const response = await fetch(`${API_BASE}/phase0/factors`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    decision_context: "Career change decision"
  })
});
const factors = await response.json();
```

## Postman Collection

Download the [Postman collection](https://api.feelfwd.app/postman-collection.json) for easy API testing.

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- JSON: https://api.feelfwd.app/openapi.json
- Interactive Docs: https://api.feelfwd.app/docs