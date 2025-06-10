from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from api import app

client = TestClient(app)

def test_phase0_factors():
    resp = client.post("/phase0/factors", json={"topic": "choosing a new job"})
    assert resp.status_code == 200
    data = resp.json()
    assert "factors" in data
    assert isinstance(data["factors"], list)


def test_phase_flow():
    pref = {
        "factor": "Remote work flexibility",
        "importance": 8,
        "hasLimit": True,
        "limit": "Must be at least 3 days remote per week",
        "tradeoff": "Would accept slightly lower salary for full remote",
    }
    resp = client.post(
        "/phase2/scenarios", json={"preferences": [pref], "topic": "choosing a new job"}
    )
    assert resp.status_code == 200
    scenarios = resp.json()["scenarios"]
    assert len(scenarios) >= 1

    reaction_payload = {
        "scenario_id": scenarios[0]["id"],
        "excitement": 7,
        "anxiety": 4,
        "body": "tense shoulders",
        "freeform": "sounds risky",
    }
    resp = client.post("/phase3/reactions", json=reaction_payload)
    assert resp.status_code == 200

    resp = client.post(
        "/phase4/summary",
        json={"reactions": [reaction_payload], "preferences": [pref]},
    )
    assert resp.status_code == 200
    assert "summary" in resp.json()
