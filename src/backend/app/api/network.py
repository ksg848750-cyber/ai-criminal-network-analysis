from fastapi import APIRouter, Depends, HTTPException
from app.auth.deps import get_current_user, TokenData
from app.graph.neo4j_client import Neo4jClient
from app.config import settings
from app.state import get_leads

router = APIRouter(prefix="/network")

@router.get("/global-graph")
def get_global_graph(current_user: TokenData = Depends(get_current_user)):
    """
    Returns the complete global knowledge graph.
    For the SIH MVP, we return the entire resolved graph without sampling.
    """
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        graph_data = client.get_graph_data()
        # Ensure we filter out CASE nodes for the pure network visualization
        nodes = [n for n in graph_data.get("nodes", []) if n["data"].get("label") != "CASE"]
        
        # Filter edges to only those connecting remaining nodes
        valid_node_ids = {n["data"]["id"] for n in nodes}
        edges = [e for e in graph_data.get("edges", []) if e["data"]["source"] in valid_node_ids and e["data"]["target"] in valid_node_ids]
        
        return {"nodes": nodes, "edges": edges}
    finally:
        client.close()

@router.get("/intelligence")
def get_global_intelligence(current_user: TokenData = Depends(get_current_user)):
    """
    Returns authoritative structured global intelligence required by the Global Intelligence Center.
    Consolidates clusters, bridge entities, cross-case entities, temporal data, and analytical leads.
    """
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        clusters = client.get_network_clusters()
        highly_connected = client.get_highly_connected_entities(limit=5)
        bridge_entities = client.get_bridge_entities(limit=5)
        cross_case = client.get_cross_case_entities()
        temporal = client.get_global_temporal_intelligence()
        
        # Global analytical leads from existing state
        all_leads = list(get_leads().values())
        open_leads = [lead.model_dump() for lead in all_leads if lead.status == 'PENDING_VERIFICATION']
        verified_leads = [lead.model_dump() for lead in all_leads if lead.status == 'VERIFIED']
        rejected_leads = [lead.model_dump() for lead in all_leads if lead.status == 'REJECTED']
        
        graph_data = client.get_graph_data()
        
        return {
            "network": {
                "total_entities": len(graph_data["nodes"]), 
                "total_relationships": len(graph_data["edges"])
            },
            "clusters": clusters,
            "highly_connected_entities": highly_connected,
            "bridge_entities": bridge_entities,
            "cross_case_entities": cross_case,
            "temporal": temporal,
            "analytical_leads": {
                "open": open_leads,
                "verified": verified_leads,
                "rejected": rejected_leads
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()
