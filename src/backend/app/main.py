from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import os

from app.config import settings
from app.graph.neo4j_client import Neo4jClient
from app.state import get_leads, get_lead, auditor
from app.db.sqlite import init_db, log_audit
from app.auth.router import router as auth_router
from app.auth.deps import get_current_user, TokenData
from app.api.upload import router as upload_router
from app.api.intelligence import router as intelligence_router
from app.api.chat import router as chat_router

app = FastAPI(title="Criminal Network Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for MVP local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

app.include_router(auth_router, tags=["auth"])
app.include_router(upload_router, tags=["upload"])
app.include_router(intelligence_router, tags=["intelligence"])
app.include_router(chat_router, tags=["chat"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/graph")
def get_graph(current_user: TokenData = Depends(get_current_user)):
    """Returns the graph structured for Cytoscape.js"""
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    graph_data = client.get_graph_data()
    client.close()
    return graph_data

@app.get("/cases")
def get_cases(current_user: TokenData = Depends(get_current_user)):
    """Returns all active investigations with summary statistics."""
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    cases = client.get_cases()
    
    all_leads = list(get_leads().values())
    
    for case in cases:
        case_id = case["id"]
        # Fetch case graph to get entities in this case
        graph_data = client.get_case_graph(case_id)
        case_entity_ids = {node["data"]["id"] for node in graph_data["nodes"]}
        
        open_lead_count = 0
        for lead in all_leads:
            if (lead.entity_a in case_entity_ids or lead.entity_b in case_entity_ids) and lead.status == 'PENDING_VERIFICATION':
                open_lead_count += 1
                
        # Get actual intelligence metrics from Layer 7 single source of truth
        summary = client.get_case_intelligence_summary(case_id)
        patterns = client.get_case_patterns(case_id)
        
        case["open_lead_count"] = open_lead_count
        case["pattern_count"] = len(patterns)
        case["cross_case_link_count"] = len(summary.get("cross_case_entities", []))
        case["last_activity"] = summary.get("temporal_bounds", {}).get("last_event") or ""
        
    client.close()
    return {"cases": cases}

@app.get("/cases/{case_id}/graph")
def get_case_graph(case_id: str, current_user: TokenData = Depends(get_current_user)):
    """Returns the graph scoped to the specific case."""
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    graph_data = client.get_case_graph(case_id)
    client.close()
    return graph_data

@app.get("/cases/{case_id}/timeline")
def get_case_timeline(case_id: str, current_user: TokenData = Depends(get_current_user)):
    """Returns the timeline of events for the specific case."""
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    timeline = client.get_case_timeline(case_id)
    client.close()
    return {"timeline": timeline}

@app.get("/cases/{case_id}/leads")
def get_case_leads(case_id: str, current_user: TokenData = Depends(get_current_user)):
    """Returns leads that have at least one entity involved in this case."""
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    graph_data = client.get_case_graph(case_id)
    client.close()
    
    # Extract entity IDs involved in this case
    case_entity_ids = {node["data"]["id"] for node in graph_data["nodes"]}
    
    all_leads = list(get_leads().values())
    case_leads = []
    
    for lead in all_leads:
        # A primary lead has BOTH entities in the case graph
        # A cross-case lead has ONE entity in the case graph
        if lead.entity_a in case_entity_ids or lead.entity_b in case_entity_ids:
            # We can optionally tag if it's cross case
            is_cross_case = lead.entity_a not in case_entity_ids or lead.entity_b not in case_entity_ids
            lead_dict = lead.model_dump()
            lead_dict["is_cross_case"] = is_cross_case
            case_leads.append(lead_dict)
            
    return {"leads": case_leads}

@app.get("/leads")
def leads_endpoint(current_user: TokenData = Depends(get_current_user)):
    return {"leads": list(get_leads().values())}

@app.get("/leads/{lead_id}")
def lead_endpoint(lead_id: str, current_user: TokenData = Depends(get_current_user)):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@app.post("/leads/{lead_id}/verify")
def verify_lead(lead_id: str, current_user: TokenData = Depends(get_current_user)):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    audit = auditor.verify_lead(lead, action="VERIFY")
    
    # Audit logging
    log_audit(
        user_id=current_user.user_id,
        username=current_user.username,
        role=current_user.role,
        action="VERIFY_LEAD",
        target_resource=lead_id,
        status="SUCCESS",
        evidence_hash=audit.evidence_hash
    )
    return {"message": "Lead verified", "audit": audit}

@app.post("/leads/{lead_id}/reject")
def reject_lead(lead_id: str, current_user: TokenData = Depends(get_current_user)):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    audit = auditor.verify_lead(lead, action="REJECT")
    
    # Audit logging
    log_audit(
        user_id=current_user.user_id,
        username=current_user.username,
        role=current_user.role,
        action="REJECT_LEAD",
        target_resource=lead_id,
        status="SUCCESS",
        evidence_hash=audit.evidence_hash
    )
    return {"message": "Lead rejected", "audit": audit}

@app.get("/entities/{entity_id}")
def get_entity(entity_id: str, current_user: TokenData = Depends(get_current_user)):
    """Fetches full entity details and relationships from Neo4j."""
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        entity_data = client.get_entity(entity_id)
        if not entity_data:
            raise HTTPException(status_code=404, detail="Entity not found")
        return entity_data
    finally:
        client.close()
