import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add src/backend to path so 'app' can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/backend')))
from app.main import app


client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_ingest_pipeline():
    # Initialize DB for tests
    from app.db.sqlite import init_db
    init_db()

    # Skip if Neo4j is not running
    try:
        from neo4j import GraphDatabase
        from app.config import settings
        driver = GraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
        driver.verify_connectivity()
        driver.close()
    except Exception:
        pytest.skip("Neo4j is not running locally or credentials are wrong.")

    # 1. Login as Admin
    login_res = client.post("/login", data={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload and Ingest
    csv_path = os.path.join(os.path.dirname(__file__), "../data/sample/crime_records.csv")
    with open(csv_path, "rb") as f:
        response = client.post("/upload", files={"file": ("crime_records.csv", f, "text/csv")}, headers=headers)
    
    assert response.status_code == 200
    data = response.json()["result"]
    assert data["message"] == "Pipeline completed successfully"
    assert data["records_processed"] == 6  # 6 records in the CSV
    assert data["leads_generated"] > 0
    
    # 3. Check the leads endpoint
    leads_response = client.get("/leads", headers=headers)
    assert leads_response.status_code == 200
    leads = leads_response.json()["leads"]
    assert len(leads) > 0
    
    # Find the planted connection between A-001 (Ravi Kumar) and B-002 (Arjun Mehta)
    planted_lead = None
    for lead in leads:
        if (lead["entity_a"] == "A-001" and lead["entity_b"] == "B-002") or \
           (lead["entity_b"] == "A-001" and lead["entity_a"] == "B-002"):
            planted_lead = lead
            break
            
    assert planted_lead is not None
    assert planted_lead["score"] > 0
    assert planted_lead["status"] == "PENDING_VERIFICATION"
    
    # 4. Test Verification
    lead_id = planted_lead["id"]
    verify_response = client.post(f"/leads/{lead_id}/verify", headers=headers)
    assert verify_response.status_code == 200
    verify_data = verify_response.json()
    
    assert verify_data["message"] == "Lead verified"
    assert "audit" in verify_data
    assert verify_data["audit"]["action"] == "VERIFY"
    assert "evidence_hash" in verify_data["audit"]
    
    # Check if status updated
    updated_lead_response = client.get(f"/leads/{lead_id}", headers=headers)
    assert updated_lead_response.status_code == 200
    assert updated_lead_response.json()["status"] == "VERIFIED"
