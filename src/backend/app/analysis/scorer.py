import logging
from typing import List, Dict, Any, Tuple
from neo4j import GraphDatabase
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)

class ScoringConfig(BaseModel):
    shared_vehicle: int = 30
    shared_phone: int = 30
    shared_location: int = 15
    shared_organization: int = 10
    shared_account: int = 10
    temporal_proximity: int = 15
    multi_hop_connection: int = 10
    threshold: int = 40  # Minimum score to be considered a lead

class Scorer:
    def __init__(self, uri: str, user: str, password: str, config: ScoringConfig = ScoringConfig()):
        self.uri = uri
        self.user = user
        self.password = password
        self.config = config

    def detect_potential_connections(self) -> List[Dict[str, Any]]:
        """
        Runs Cypher queries to find potential connections between Person entities
        based on shared attributes.
        """
        logger.info("Detecting potential connections...")
        leads = []
        
        try:
            driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            with driver.session() as session:
                # Query to find pairs of people sharing things
                # To avoid duplicates, we enforce id(p1) < id(p2)
                query = """
                MATCH (p1:PERSON)
                MATCH (p2:PERSON)
                WHERE p1.id < p2.id
                
                // Find all shared paths
                OPTIONAL MATCH (p1)-[r1]->(shared)<-[r2]-(p2)
                
                WITH p1, p2, collect({node: shared, rel1: r1, rel2: r2}) as shared_paths
                WHERE size(shared_paths) > 0
                
                RETURN p1, p2, shared_paths
                """
                
                results = session.run(query)
                
                for record in results:
                    p1 = record["p1"]
                    p2 = record["p2"]
                    shared_paths = record["shared_paths"]
                    
                    score = 0
                    reasons = []
                    supporting_cases = set()
                    
                    for path in shared_paths:
                        shared_node = path["node"]
                        r1 = path["rel1"]
                        r2 = path["rel2"]
                        
                        if shared_node:
                            labels = list(shared_node.labels)
                            if "VEHICLE" in labels:
                                score += self.config.shared_vehicle
                                reasons.append(f"Shared vehicle {shared_node.get('name', shared_node['id'])}")
                            elif "PHONE" in labels:
                                score += self.config.shared_phone
                                reasons.append(f"Shared phone {shared_node.get('name', shared_node['id'])}")
                            elif "LOCATION" in labels:
                                score += self.config.shared_location
                                reasons.append(f"Shared location {shared_node.get('name', shared_node['id'])}")
                            elif "ORGANIZATION" in labels:
                                score += self.config.shared_organization
                                reasons.append(f"Shared organization {shared_node.get('name', shared_node['id'])}")
                            elif "ACCOUNT" in labels:
                                score += self.config.shared_account
                                reasons.append(f"Shared account {shared_node.get('name', shared_node['id'])}")
                                
                            # Check temporal proximity if timestamps are available
                            if r1 and r2 and r1.get('timestamp') and r2.get('timestamp'):
                                try:
                                    t1 = datetime.fromisoformat(r1['timestamp'].replace('Z', '+00:00'))
                                    t2 = datetime.fromisoformat(r2['timestamp'].replace('Z', '+00:00'))
                                    diff_days = abs((t1 - t2).days)
                                    if diff_days <= 7:  # within a week
                                        # Only add temporal score once per pair to avoid overinflating
                                        if "Events occurred within 7 days" not in reasons:
                                            score += self.config.temporal_proximity
                                            reasons.append("Events occurred within 7 days")
                                except Exception:
                                    pass

                            # Collect source records for evidence
                            if r1 and r1.get('source_record_id'):
                                supporting_cases.add(r1['source_record_id'])
                            if r2 and r2.get('source_record_id'):
                                supporting_cases.add(r2['source_record_id'])
                    
                    if len(shared_paths) > 1:
                        score += self.config.multi_hop_connection
                        reasons.append(f"Connected through {len(shared_paths)} paths")

                    if score >= self.config.threshold:
                        leads.append({
                            "entity_a": p1["id"],
                            "entity_b": p2["id"],
                            "entity_a_name": p1.get("name", p1["id"]),
                            "entity_b_name": p2.get("name", p2["id"]),
                            "score": score,
                            "reasons": reasons,
                            "supporting_cases": list(supporting_cases)
                        })
                        
            driver.close()
        except Exception as e:
            logger.error(f"Error during graph scoring: {e}")
            
        logger.info(f"Generated {len(leads)} potential connections.")
        return leads
