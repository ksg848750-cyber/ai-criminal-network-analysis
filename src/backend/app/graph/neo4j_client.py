from neo4j import GraphDatabase
import logging
from typing import List, Dict, Any
from app.models.entities import Entity, EntityType
from app.models.relationships import Relationship

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self, uri: str, user: str, password: str):
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j at {uri}: {e}")
            raise

    def close(self):
        if self.driver:
            self.driver.close()
            
    def clear_database(self):
        """DANGER: Clears the entire database. Used for MVP fresh state."""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            logger.info("Database cleared.")

    def load_entities_and_relationships(self, entities: List[Entity], relationships: List[Relationship]):
        """
        Loads all entities as nodes and relationships as edges.
        """
        logger.info(f"Loading {len(entities)} entities and {len(relationships)} relationships into Neo4j...")
        
        with self.driver.session() as session:
            # Create Nodes
            for entity in entities:
                # Use parameterized cypher to prevent injection
                query = f"""
                MERGE (n:{entity.type.value} {{id: $id}})
                SET n.name = $name, n.source_record_id = $source_record_id, n.confidence = $confidence
                """
                session.run(query, 
                            id=entity.id, 
                            name=entity.name, 
                            source_record_id=entity.source_record_id, 
                            confidence=entity.confidence)

            # Create Relationships
            for rel in relationships:
                # Merge relationship based on source and target IDs
                # Note: labels are dynamic in query strings but relation types can be parametrized similarly with APOC,
                # but standard Cypher requires relationship types to be static in the query string.
                rel_type = rel.type.value
                query = f"""
                MATCH (a {{id: $source_id}})
                MATCH (b {{id: $target_id}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r.source_record_id = $source_record_id, r.timestamp = $timestamp, r.confidence = $confidence
                """
                session.run(query, 
                            source_id=rel.source_entity_id, 
                            target_id=rel.target_entity_id,
                            source_record_id=rel.source_record_id,
                            timestamp=rel.timestamp,
                            confidence=rel.confidence)
                            
        logger.info("Finished loading graph data.")

    def get_graph_data(self) -> Dict[str, List[Any]]:
        """
        Returns the entire graph structured for Cytoscape (nodes and edges).
        """
        with self.driver.session() as session:
            result = session.run("""
            MATCH (n)
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN n, r, m
            """)
            
            nodes = {}
            edges = []
            
            for record in result:
                n = record["n"]
                if n and n.element_id not in nodes:
                    nodes[n.element_id] = {
                        "data": {
                            "id": n["id"],
                            "label": list(n.labels)[0],
                            "name": n.get("name", ""),
                            "source_record_id": n.get("source_record_id", "")
                        }
                    }
                
                m = record["m"]
                r = record["r"]
                if m and m.element_id not in nodes:
                    nodes[m.element_id] = {
                        "data": {
                            "id": m["id"],
                            "label": list(m.labels)[0],
                            "name": m.get("name", ""),
                            "source_record_id": m.get("source_record_id", "")
                        }
                    }
                    
                if r:
                    edges.append({
                        "data": {
                            "id": r.element_id,
                            "source": n["id"],
                            "target": m["id"],
                            "type": r.type,
                            "source_record_id": r.get("source_record_id", ""),
                            "timestamp": r.get("timestamp", "")
                        }
                    })
                    
            return {
                "nodes": list(nodes.values()),
                "edges": edges
            }

    def get_entity(self, entity_id: str) -> Dict[str, Any]:
        """
        Fetches detailed properties of a specific entity and its immediate relationships.
        """
        with self.driver.session() as session:
            result = session.run("""
            MATCH (n {id: $id})
            OPTIONAL MATCH (n)-[r]-(m)
            RETURN n, r, m
            """, id=entity_id)
            
            entity_data = None
            relationships = []
            
            for record in result:
                n = record["n"]
                if not n:
                    continue
                    
                if not entity_data:
                    entity_data = {
                        "id": n["id"],
                        "type": list(n.labels)[0] if n.labels else "UNKNOWN",
                        "name": n.get("name", ""),
                        "source_record_id": n.get("source_record_id", ""),
                        "properties": {k: v for k, v in n.items() if k not in ["id", "name", "source_record_id"]}
                    }
                    
                r = record["r"]
                m = record["m"]
                if r and m:
                    relationships.append({
                        "relationship_type": r.type,
                        "connected_entity_id": m["id"],
                        "connected_entity_name": m.get("name", ""),
                        "connected_entity_type": list(m.labels)[0] if m.labels else "UNKNOWN",
                        "source_record_id": r.get("source_record_id", ""),
                        "timestamp": r.get("timestamp", "")
                    })
                    
            if not entity_data:
                return None
                
            entity_data["relationships"] = relationships
            return entity_data


    def get_cases(self) -> List[Dict[str, Any]]:
        """Returns a list of all cases with summary statistics."""
        with self.driver.session() as session:
            result = session.run("""
            MATCH (c:CASE)
            OPTIONAL MATCH (c)<-[:INVOLVED_IN]-(p:PERSON)-[r]-(e)
            RETURN c.id AS id, 
                   c.name AS name, 
                   c.date AS date, 
                   c.description AS description,
                   COUNT(DISTINCT p) + COUNT(DISTINCT e) AS entity_count,
                   COUNT(DISTINCT r) AS relationship_count
            ORDER BY c.date DESC
            """)
            cases = []
            for record in result:
                cases.append({
                    "id": record["id"],
                    "name": record["name"],
                    "date": record["date"],
                    "description": record["description"],
                    "entity_count": record["entity_count"],
                    "relationship_count": record["relationship_count"]
                })
            return cases

    def get_case_graph(self, case_id: str) -> Dict[str, List[Any]]:
        """
        Returns a case-scoped graph (Person -> 1 hop Entities).
        Also flags entities that are connected to other cases as cross-case.
        CASE nodes are omitted from the visualization to reduce clutter, since
        the whole workspace is already contextually scoped to the CASE.
        """
        with self.driver.session() as session:
            # First, fetch the subgraph
            subgraph_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p:PERSON)
            OPTIONAL MATCH (p)-[r]-(e)
            WHERE labels(e)[0] <> 'CASE'
            RETURN p, r, e
            """
            result = session.run(subgraph_query, case_id=case_id)
            
            nodes = {}
            edges = []
            
            # Helper to add node
            def add_node(n, is_cross_case=False):
                if n and n.element_id not in nodes:
                    nodes[n.element_id] = {
                        "data": {
                            "id": n["id"],
                            "label": list(n.labels)[0] if n.labels else "UNKNOWN",
                            "name": n.get("name", ""),
                            "source_record_id": n.get("source_record_id", ""),
                            "is_cross_case": is_cross_case
                        }
                    }

            for record in result:
                p = record["p"]
                e = record["e"]
                r = record["r"]
                
                if p:
                    add_node(p)
                if e:
                    add_node(e)
                if r:
                    edges.append({
                        "data": {
                            "id": r.element_id,
                            "source": r.nodes[0]["id"], # use actual direction
                            "target": r.nodes[1]["id"],
                            "type": r.type,
                            "source_record_id": r.get("source_record_id", ""),
                            "timestamp": r.get("timestamp", "")
                        }
                    })
                    
            # Identify cross-case entities
            # Look for entities in our current nodes dictionary that are INVOLVED_IN another Case.
            # Usually only PERSON is INVOLVED_IN a CASE directly in the current model.
            node_ids = [n["data"]["id"] for n in nodes.values()]
            
            if not node_ids:
                return {"nodes": [], "edges": []}
                
            cross_case_query = """
            MATCH (p:PERSON)-[:INVOLVED_IN]->(other:CASE)
            WHERE other.id <> $case_id AND p.id IN $node_ids
            RETURN DISTINCT p.id AS cross_id
            """
            cross_result = session.run(cross_case_query, case_id=case_id, node_ids=node_ids)
            cross_ids = set([record["cross_id"] for record in cross_result])
            
            # Also, non-person entities shared between persons of different cases.
            cross_entity_query = """
            MATCH (e)-[]-(p:PERSON)-[:INVOLVED_IN]->(other:CASE)
            WHERE other.id <> $case_id AND e.id IN $node_ids
            RETURN DISTINCT e.id AS cross_id
            """
            cross_ent_result = session.run(cross_entity_query, case_id=case_id, node_ids=node_ids)
            cross_ids.update([record["cross_id"] for record in cross_ent_result])
            
            for node in nodes.values():
                if node["data"]["id"] in cross_ids and node["data"]["label"] != "CASE":
                    node["data"]["is_cross_case"] = True

            # Deduplicate edges by id
            unique_edges = {e["data"]["id"]: e for e in edges}.values()

            return {
                "nodes": list(nodes.values()),
                "edges": list(unique_edges)
            }

    def get_case_timeline(self, case_id: str) -> List[Dict[str, Any]]:
        """Returns chronological list of relationship events for a case."""
        with self.driver.session() as session:
            query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p:PERSON)-[r]-(e)
            WHERE r.timestamp IS NOT NULL AND r.timestamp <> ""
            RETURN p.name AS person_name, p.id AS person_id,
                   type(r) AS action,
                   e.name AS target_name, e.id AS target_id, labels(e)[0] AS target_type,
                   r.timestamp AS timestamp, r.source_record_id AS source_record_id
            ORDER BY r.timestamp ASC
            """
            result = session.run(query, case_id=case_id)
            timeline = []
            for record in result:
                timeline.append({
                    "person_name": record["person_name"],
                    "person_id": record["person_id"],
                    "action": record["action"],
                    "target_name": record["target_name"],
                    "target_id": record["target_id"],
                    "target_type": record["target_type"],
                    "timestamp": record["timestamp"],
                    "source_record_id": record["source_record_id"]
                })
            return timeline

    def get_case_intelligence_summary(self, case_id: str) -> Dict[str, Any]:
        """
        Compiles the deterministic intelligence facts for a case.
        Includes entity counts, degree centrality, temporal bounds, and cross-case shared entities.
        """
        with self.driver.session() as session:
            summary = {
                "entity_counts": {},
                "key_entities": [],
                "temporal_bounds": {"first_event": None, "last_event": None},
                "cross_case_entities": []
            }
            
            # 1. Entity Counts
            count_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p:PERSON)
            OPTIONAL MATCH (p)-[]-(e) WHERE labels(e)[0] <> 'CASE'
            WITH collect(DISTINCT p) + collect(DISTINCT e) AS all_nodes
            UNWIND all_nodes AS n
            RETURN labels(n)[0] AS type, count(DISTINCT n) AS count
            """
            for record in session.run(count_query, case_id=case_id):
                summary["entity_counts"][record["type"]] = record["count"]
                
            # 2. Key Entities (Degree Centrality)
            degree_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p:PERSON)-[r]-()
            WHERE type(r) <> 'INVOLVED_IN'
            RETURN p.id AS id, p.name AS name, count(r) AS degree
            ORDER BY degree DESC LIMIT 5
            """
            for record in session.run(degree_query, case_id=case_id):
                summary["key_entities"].append({
                    "id": record["id"],
                    "name": record["name"],
                    "degree": record["degree"]
                })
                
            # 3. Temporal Bounds
            time_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p:PERSON)-[r]-()
            WHERE r.timestamp IS NOT NULL AND r.timestamp <> ""
            RETURN min(r.timestamp) AS first_event, max(r.timestamp) AS last_event
            """
            time_result = session.run(time_query, case_id=case_id).single()
            if time_result:
                summary["temporal_bounds"] = {
                    "first_event": time_result["first_event"],
                    "last_event": time_result["last_event"]
                }
                
            # 4. Cross-Case Entities
            cross_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p1:PERSON)-[]-(e)
            MATCH (e)-[]-(p2:PERSON)-[:INVOLVED_IN]->(other:CASE)
            WHERE other.id <> $case_id AND labels(e)[0] <> 'CASE'
            RETURN DISTINCT e.id AS id, e.name AS name, labels(e)[0] AS type, collect(DISTINCT other.id) AS other_cases
            """
            for record in session.run(cross_query, case_id=case_id):
                summary["cross_case_entities"].append({
                    "id": record["id"],
                    "name": record["name"],
                    "type": record["type"],
                    "other_cases": record["other_cases"]
                })
                
            return summary

    def get_case_patterns(self, case_id: str) -> List[Dict[str, Any]]:
        """
        Calculates deterministic patterns for the case intelligence engine.
        Currently supports: REPEATED_INTERACTION and TEMPORAL_BURST.
        """
        findings = []
        with self.driver.session() as session:
            # 1. Repeated Interactions (Entities shared by multiple people in this case)
            rep_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p1:PERSON)-[r1]->(e)<-[r2]-(p2:PERSON)-[:INVOLVED_IN]->(c)
            WHERE elementId(p1) < elementId(p2) AND labels(e)[0] <> 'CASE'
            WITH p1, p2, e, count(r1) + count(r2) AS interaction_count,
                 collect(r1.source_record_id) + collect(r2.source_record_id) AS records,
                 min(r1.timestamp) AS min_time, max(r2.timestamp) AS max_time
            WHERE interaction_count >= 2
            RETURN p1.id AS p1_id, p1.name AS p1_name,
                   p2.id AS p2_id, p2.name AS p2_name,
                   e.id AS e_id, e.name AS e_name, labels(e)[0] AS e_type,
                   interaction_count,
                   records, min_time, max_time
            """
            for record in session.run(rep_query, case_id=case_id):
                # Filter out None and deduplicate records
                records = list(set([r for r in record["records"] if r]))
                findings.append({
                    "finding_type": "REPEATED_INTERACTION",
                    "description": f"{record['p1_name']} and {record['p2_name']} both interacted with {record['e_type']} '{record['e_name']}'.",
                    "involved_entities": [record["p1_id"], record["p2_id"], record["e_id"]],
                    "reason": f"{record['interaction_count']} overlapping interactions detected.",
                    "time_window": f"{record['min_time']} to {record['max_time']}",
                    "supporting_records": records
                })
                
            # 2. Temporal Burst (>= 3 events in a single day for a person)
            burst_query = """
            MATCH (c:CASE {id: $case_id})<-[:INVOLVED_IN]-(p:PERSON)-[r]-(e)
            WHERE r.timestamp IS NOT NULL AND r.timestamp <> ""
            WITH p, substring(r.timestamp, 0, 10) AS date_bucket, count(r) AS event_count, collect(r.source_record_id) AS records
            WHERE event_count >= 3
            RETURN p.id AS p_id, p.name AS p_name, date_bucket, event_count, records
            """
            for record in session.run(burst_query, case_id=case_id):
                records = list(set([r for r in record["records"] if r]))
                findings.append({
                    "finding_type": "TEMPORAL_BURST",
                    "description": f"High activity detected for {record['p_name']} on {record['date_bucket']}.",
                    "involved_entities": [record["p_id"]],
                    "reason": f"{record['event_count']} events recorded in a single 24-hour period.",
                    "time_window": record["date_bucket"],
                    "supporting_records": records
                })
                
        return findings

    def _build_networkx_graph(self):
        import networkx as nx
        G = nx.Graph()
        graph_data = self.get_graph_data()
        
        for node in graph_data["nodes"]:
            if node["data"].get("label") == "CASE":
                continue
            G.add_node(node["data"]["id"], **node["data"])
            
        for edge in graph_data["edges"]:
            if G.has_node(edge["data"]["source"]) and G.has_node(edge["data"]["target"]):
                G.add_edge(edge["data"]["source"], edge["data"]["target"], **edge["data"])
                
        return G

    def get_network_clusters(self) -> List[Dict[str, Any]]:
        import networkx as nx
        G = self._build_networkx_graph()
        clusters = []
        for i, component in enumerate(nx.connected_components(G)):
            if len(component) > 1:
                nodes = [G.nodes[n] for n in component]
                clusters.append({
                    "id": f"cluster-{i}",
                    "name": f"Potential Network Cluster {i+1}",
                    "size": len(component),
                    "node_ids": list(component),
                    "nodes": nodes
                })
        clusters.sort(key=lambda x: x["size"], reverse=True)
        return clusters

    def get_highly_connected_entities(self, limit: int = 5) -> List[Dict[str, Any]]:
        G = self._build_networkx_graph()
        degrees = dict(G.degree())
        top_nodes = sorted(degrees.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        results = []
        for node_id, degree in top_nodes:
            if degree > 0:
                node_data = G.nodes[node_id]
                results.append({
                    "id": node_id,
                    "name": node_data.get("name", ""),
                    "type": node_data.get("label", ""),
                    "degree": degree
                })
        return results

    def get_bridge_entities(self, limit: int = 5) -> List[Dict[str, Any]]:
        import networkx as nx
        G = self._build_networkx_graph()
        if len(G.nodes) == 0:
            return []
        betweenness = nx.betweenness_centrality(G)
        top_nodes = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        results = []
        for node_id, score in top_nodes:
            if score > 0:
                node_data = G.nodes[node_id]
                results.append({
                    "id": node_id,
                    "name": node_data.get("name", ""),
                    "type": node_data.get("label", ""),
                    "betweenness_score": round(score, 4)
                })
        return results

    def get_cross_case_entities(self) -> List[Dict[str, Any]]:
        with self.driver.session() as session:
            query = """
            MATCH (e)-[]-(p:PERSON)-[:INVOLVED_IN]->(c:CASE)
            WHERE labels(e)[0] <> 'CASE'
            WITH e, count(DISTINCT c) AS case_count, collect(DISTINCT c.id) AS cases
            WHERE case_count > 1
            RETURN e.id AS id, e.name AS name, labels(e)[0] AS type, case_count, cases
            ORDER BY case_count DESC
            """
            results = []
            for record in session.run(query):
                results.append({
                    "id": record["id"],
                    "name": record["name"],
                    "type": record["type"],
                    "case_count": record["case_count"],
                    "cases": record["cases"]
                })
            return results

    def get_global_temporal_intelligence(self) -> Dict[str, Any]:
        with self.driver.session() as session:
            query = """
            MATCH ()-[r]->()
            WHERE r.timestamp IS NOT NULL AND r.timestamp <> ""
            RETURN min(r.timestamp) AS first_event, max(r.timestamp) AS last_event, count(r) AS total_events
            """
            record = session.run(query).single()
            if record:
                return {
                    "first_event": record["first_event"],
                    "last_event": record["last_event"],
                    "total_events": record["total_events"]
                }
            return {"first_event": None, "last_event": None, "total_events": 0}

