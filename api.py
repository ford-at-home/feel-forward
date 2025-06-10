"""FastAPI entrypoint for the Feel Forward backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import (
    Phase0Request, Phase0Response,
    Phase1Request, Phase1Response,
    Phase2Request, Phase2Response,
    Phase3Request, Phase3Response,
    Phase4Request, Phase4Response,
)
from strands.agent import (
    FactorDiscoveryAgent,
    PreferenceDetailAgent,
    ScenarioBuilderAgent,
    EmotionalReactionAgent,
    InsightSynthesisAgent,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://feel-forward.web.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/phase0/factors", response_model=Phase0Response)
def phase0_factors(request: Phase0Request):
    agent = FactorDiscoveryAgent()
    factors = agent.run(request.topic)
    return Phase0Response(factors=factors)

@app.post("/phase1/preferences", response_model=Phase1Response)
def phase1_preferences(request: Phase1Request):
    agent = PreferenceDetailAgent()
    prefs = agent.run(request.preferences)
    return Phase1Response(preferences=prefs)

@app.post("/phase2/scenarios", response_model=Phase2Response)
def phase2_scenarios(request: Phase2Request):
    agent = ScenarioBuilderAgent()
    scenarios = agent.run(request.preferences)
    return Phase2Response(scenarios=scenarios)

@app.post("/phase3/reactions", response_model=Phase3Response)
def phase3_reactions(request: Phase3Request):
    agent = EmotionalReactionAgent()
    reactions = agent.run(request.reactions)
    return Phase3Response(reactions=reactions)

@app.post("/phase4/summary", response_model=Phase4Response)
def phase4_summary(request: Phase4Request):
    agent = InsightSynthesisAgent()
    summary = agent.run(request.reactions)
    return Phase4Response(summary=summary)
