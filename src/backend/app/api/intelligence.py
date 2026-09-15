from fastapi import APIRouter, Depends, HTTPException
from app.auth.deps import get_current_user, TokenData
from app.graph.neo4j_client import Neo4jClient
from app.config import settings

router = APIRouter(prefix="/cases")

@router.get("/{case_id}/intelligence")
def get_case_intelligence(case_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    Returns the authoritative deterministic intelligence facts for a case.
    """
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        # Check if case exists / validate access if needed
        # For now, just generate the summary
        summary = client.get_case_intelligence_summary(case_id)
        patterns = client.get_case_patterns(case_id)
        
        return {
            "case_id": case_id,
            "summary": summary,
            "patterns": patterns
        }
    finally:
        client.close()

from app.services.ai_service import get_ai_service

@router.get("/{case_id}/brief")
def get_case_brief(case_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    Generates a structured case brief aggregating the facts from `/intelligence` using the AI Provider.
    """
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        summary = client.get_case_intelligence_summary(case_id)
        patterns = client.get_case_patterns(case_id)
    finally:
        client.close()
        
    ai = get_ai_service()
    system_prompt = f"""
    You are an AI Criminal Investigator Assistant. Based ONLY on the following deterministic facts, 
    generate a highly professional Case Intelligence Brief for case {case_id}.
    
    Facts:
    Entity Counts: {summary.get('entity_counts')}
    Key Entities: {summary.get('key_entities')}
    Cross-Case Shared Entities: {summary.get('cross_case_entities')}
    Temporal Bounds: {summary.get('temporal_bounds')}
    Detected Patterns: {patterns}
    
    Return a JSON object with this exact schema:
    {{
      "response_text": "The formatted text of the brief, formatted nicely in markdown. Include sections for Case Overview, Entity Breakdown, Key Entities, Analytical Findings, and Cross-Case Connections.",
      "suggested_actions": []
    }}
    """
    
    try:
        ai = get_ai_service()
        result = ai.generate_response(system_prompt=system_prompt, user_prompt="Generate the case brief.")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate brief: {str(e)}")
