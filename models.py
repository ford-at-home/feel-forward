"""Pydantic models for the Feel Forward REST API."""

from typing import List, Optional
from pydantic import BaseModel


class FactorCategory(BaseModel):
    """Group of decision factors under a category."""

    category: str
    items: List[str]


class Phase0Request(BaseModel):
    topic: str


class Phase0Response(BaseModel):
    factors: List[FactorCategory]


class Preference(BaseModel):
    factor: str
    importance: int
    hasLimit: bool = False
    limit: Optional[str] = None
    tradeoff: Optional[str] = None


class Phase1Request(BaseModel):
    preferences: List[Preference]
    topic: Optional[str] = None


class Phase1Response(BaseModel):
    preferences: List[Preference]


class Scenario(BaseModel):
    id: str
    title: str
    text: str


class Phase2Request(BaseModel):
    preferences: List[Preference]
    topic: str


class Phase2Response(BaseModel):
    scenarios: List[Scenario]


class Reaction(BaseModel):
    scenario_id: str
    excitement: int
    anxiety: int
    body: Optional[str] = None
    freeform: Optional[str] = None


class Phase3Request(BaseModel):
    scenario_id: str
    excitement: int
    anxiety: int
    body: Optional[str] = None
    freeform: Optional[str] = None


class Phase3Response(BaseModel):
    status: str


class Phase4Request(BaseModel):
    reactions: List[Reaction]
    preferences: List[Preference]


class Phase4Response(BaseModel):
    summary: str

