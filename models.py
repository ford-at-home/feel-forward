"""Pydantic models for Feel Forward API."""
from typing import List, Optional
from pydantic import BaseModel

class Factor(BaseModel):
    id: str
    name: str
    category: str

class Phase0Request(BaseModel):
    topic: str

class Phase0Response(BaseModel):
    factors: List[Factor]

class Preference(BaseModel):
    factor_id: str
    preference: str
    importance: int = 3
    hard_limit: bool = False

class Phase1Request(BaseModel):
    preferences: List[Preference]

class Phase1Response(BaseModel):
    preferences: List[Preference]

class Scenario(BaseModel):
    id: str
    title: str
    text: str

class Phase2Request(BaseModel):
    preferences: List[Preference]

class Phase2Response(BaseModel):
    scenarios: List[Scenario]

class Reaction(BaseModel):
    scenario_id: str
    excitement: int
    anxiety: int
    body: Optional[str] = None
    comment: Optional[str] = None

class Phase3Request(BaseModel):
    reactions: List[Reaction]

class Phase3Response(BaseModel):
    reactions: List[Reaction]

class Phase4Request(BaseModel):
    reactions: List[Reaction]

class Phase4Response(BaseModel):
    summary: str
