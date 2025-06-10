from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from api import app

client = TestClient(app)

def test_phase0_factors():
    resp = client.post("/phase0/factors", json={"topic": "jobs"})
    assert resp.status_code == 200
    data = resp.json()
    assert "factors" in data
    assert len(data["factors"]) > 0


def test_phase4_summary():
    reaction = {"scenario_id": "s1", "excitement": 5, "anxiety": 1}
    resp = client.post("/phase4/summary", json={"reactions": [reaction]})
    assert resp.status_code == 200
    assert "summary" in resp.json()
