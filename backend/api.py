"""FastAPI entrypoint for the Feel Forward backend."""
from collections import defaultdict
import time
from typing import Callable

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    Phase0Request, Phase0Response,
    Phase1Request, Phase1Response,
    Phase2Request, Phase2Response,
    Phase3Request, Phase3Response,
    Phase4Request, Phase4Response,
    Reaction,
)
from strands.agent import (
    FactorDiscoveryAgent,
    PreferenceDetailAgent,
    ScenarioBuilderAgent,
    EmotionalReactionAgent,
    InsightSynthesisAgent,
)

app = FastAPI(
    title="Feel Forward API",
    description="Multi-phase self-awareness app that helps users gain emotional clarity about their preferences through a structured LLM-powered workflow.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://feelfwd.app", "https://www.feelfwd.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for load balancer
@app.get("/health")
async def health() -> dict:
    """Return service status for health checks."""
    return {"status": "ok"}

# ---- Rate limiting ---------------------------------------------------------
REQUEST_LOG = defaultdict(list)
RATE = 60
WINDOW = 60

def rate_limiter(request: Request) -> None:
    ip = request.client.host
    now = time.time()
    REQUEST_LOG[ip] = [t for t in REQUEST_LOG[ip] if now - t < WINDOW]
    if len(REQUEST_LOG[ip]) >= RATE:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    REQUEST_LOG[ip].append(now)

# ---- Error handling --------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": True, "errorMessage": exc.detail})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": True, "errorMessage": "Internal server error"})


# ---- Endpoints -------------------------------------------------------------
@app.post("/phase0/factors", response_model=Phase0Response, summary="Discover decision factors", 
          description="Identifies relevant decision variables for a given topic (e.g., job choice, housing)")
async def phase0_factors(request: Phase0Request, _: Callable = Depends(rate_limiter)):
    agent = FactorDiscoveryAgent()
    factors = agent.run(request.topic)
    return Phase0Response(factors=factors)


@app.post("/phase1/preferences", response_model=Phase1Response, summary="Detail preferences",
          description="Collects detailed information about user preferences, trade-offs, and thresholds")
async def phase1_preferences(request: Phase1Request, _: Callable = Depends(rate_limiter)):
    agent = PreferenceDetailAgent()
    prefs = agent.run(request.preferences, request.topic)
    return Phase1Response(preferences=prefs)


@app.post("/phase2/scenarios", response_model=Phase2Response, summary="Generate scenarios",
          description="Creates realistic decision scenarios based on user preferences")
async def phase2_scenarios(request: Phase2Request, _: Callable = Depends(rate_limiter)):
    agent = ScenarioBuilderAgent()
    scenarios = agent.run(request.preferences, request.topic)
    return Phase2Response(scenarios=scenarios)


@app.post("/phase3/reactions", response_model=Phase3Response, summary="Log emotional reactions",
          description="Records user's emotional and somatic responses to scenarios")
async def phase3_reactions(request: Phase3Request, _: Callable = Depends(rate_limiter)):
    agent = EmotionalReactionAgent()
    status = agent.run(Reaction(**request.model_dump()))
    return Phase3Response(status=status)


@app.post("/phase4/summary", response_model=Phase4Response, summary="Synthesize insights",
          description="Analyzes emotional patterns and generates insights about user preferences")
async def phase4_summary(request: Phase4Request, _: Callable = Depends(rate_limiter)):
    agent = InsightSynthesisAgent()
    summary = agent.run(request.reactions, request.preferences)
    return Phase4Response(summary=summary)
