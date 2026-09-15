from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.auth.deps import get_current_user, TokenData
from app.services.ai_service import get_ai_service
from app.graph.neo4j_client import Neo4jClient
from app.config import settings

router = APIRouter(prefix="/cases")

class ChatRequest(BaseModel):
    message: str

@router.post("/{case_id}/chat")
def chat_with_case(case_id: str, request: ChatRequest, current_user: TokenData = Depends(get_current_user)):
    """
    Tool-grounded AI Investigator endpoint.
    Takes user's question, retrieves deterministic facts, and asks LLM to answer.
    """
    # 1. Fetch Facts
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        summary = client.get_case_intelligence_summary(case_id)
        patterns = client.get_case_patterns(case_id)
        timeline = client.get_case_timeline(case_id)
        
        # We need the list of case entity IDs for validation
        graph = client.get_case_graph(case_id)
        valid_entity_ids = {node["data"]["id"] for node in graph["nodes"]}
    finally:
        client.close()

    # 2. Build the System Prompt
    system_prompt = f"""
    You are an AI Criminal Investigator Assistant. You analyze case data and explain findings based ONLY on the provided facts.
    You MUST NOT hallucinate, invent dates, entities, or connections.
    If the facts do not contain the answer, say "I don't have enough information to answer that based on the case data."
    
    Case Intelligence Facts:
    Entity Counts: {summary.get('entity_counts')}
    Key Entities: {summary.get('key_entities')}
    Cross-Case Shared Entities: {summary.get('cross_case_entities')}
    
    Detected Patterns:
    {patterns}
    
    Timeline summary (use only to answer timeline specific questions):
    Total events: {len(timeline)}.
    
    When answering, you must return a strict JSON object with this schema:
    {{
       "response_text": "Your explanation here. Make it professional and concise.",
       "suggested_actions": [
          {{ "type": "HIGHLIGHT_NODES", "target_ids": ["ID1", "ID2"] }},
          {{ "type": "SHOW_TIMELINE_EVENT", "target_ids": ["RECORD_ID"] }}
       ]
    }}
    
    Supported Action Types: HIGHLIGHT_NODES, HIGHLIGHT_RELATIONSHIP, SHOW_LEAD, SHOW_EVIDENCE, SHOW_TIMELINE_EVENT, SHOW_CROSS_CASE, FOCUS_ENTITY, EXPAND_ENTITY.
    Only suggest actions that directly support your explanation. Target IDs must be entity IDs (e.g., P-101) or record IDs for evidence/timeline.
    """

    # 3. Call AI Service
    try:
        ai = get_ai_service()
        result = ai.generate_response(system_prompt=system_prompt, user_prompt=request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service error: {str(e)}")

    # 4. Action Validation (Layer 8 Security)
    validated_actions = []
    if "suggested_actions" in result:
        for action in result["suggested_actions"]:
            action_type = action.get("type")
            target_ids = action.get("target_ids", [])
            
            # Filter target IDs to ensure they actually exist in this case's graph
            # (Exceptions might be record IDs, which we can optionally validate, 
            # but for HIGHLIGHT_NODES we MUST validate against valid_entity_ids)
            if action_type in ["HIGHLIGHT_NODES", "FOCUS_ENTITY", "EXPAND_ENTITY"]:
                valid_targets = [tid for tid in target_ids if tid in valid_entity_ids]
                if valid_targets:
                    validated_actions.append({"type": action_type, "target_ids": valid_targets})
            else:
                # Pass through other actions for now
                validated_actions.append(action)
                
    result["suggested_actions"] = validated_actions
    
    return result
