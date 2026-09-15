import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/backend')))
from app.main import app
from app.auth.security import create_access_token

from app.auth.deps import get_current_user, TokenData

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: TokenData(
        username="test_investigator",
        user_id="usr_123",
        role="investigator"
    )
    yield
    app.dependency_overrides = {}

@pytest.fixture
def auth_headers():
    return {}

def test_global_graph_auth(auth_headers):
    # Missing auth
    response = client.get("/network/global-graph")
    assert response.status_code == 401

def test_global_graph(auth_headers):
    response = client.get("/network/global-graph", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    
    # Ensure no CASE nodes are in the global graph visualization
    case_nodes = [n for n in data["nodes"] if n["data"].get("label") == "CASE"]
    assert len(case_nodes) == 0

def test_global_intelligence(auth_headers):
    response = client.get("/network/intelligence", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert "network" in data
    assert "clusters" in data
    assert "highly_connected_entities" in data
    assert "bridge_entities" in data
    assert "cross_case_entities" in data
    assert "temporal" in data
    assert "analytical_leads" in data
    
    assert isinstance(data["clusters"], list)
    assert isinstance(data["highly_connected_entities"], list)
    assert isinstance(data["bridge_entities"], list)
    assert isinstance(data["cross_case_entities"], list)
    assert isinstance(data["analytical_leads"]["open"], list)
