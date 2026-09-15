import uuid
from typing import List, Dict, Any
from app.models.intelligence import Lead, Evidence

class EvidenceTracker:
    def __init__(self):
        pass
        
    def generate_leads(self, raw_connections: List[Dict[str, Any]]) -> List[Lead]:
        """
        Converts the raw potential connections from the Scorer into formal Lead objects,
        packaging the supporting evidence.
        """
        leads = []
        for conn in raw_connections:
            evidence_list = []
            for case_id in conn.get("supporting_cases", []):
                evidence_list.append(Evidence(
                    source_record_id=case_id,
                    description=f"Source record involved in connecting {conn['entity_a_name']} and {conn['entity_b_name']}."
                ))
            
            lead = Lead(
                id=str(uuid.uuid4()),
                entity_a=conn["entity_a"],
                entity_b=conn["entity_b"],
                entity_a_name=conn["entity_a_name"],
                entity_b_name=conn["entity_b_name"],
                score=conn["score"],
                reasons=conn["reasons"],
                evidence=evidence_list
            )
            leads.append(lead)
            
        return leads
