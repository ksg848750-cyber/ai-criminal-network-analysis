"""
Cross-case test fixture loader.

Creates a synthetic scenario where:
  - CASE-105:  Neha Sharma (B-005) uses phone P-505 and visits location L-030
  - CASE-204:  Priya Kapoor (D-204) ALSO uses the same phone P-505

This makes P-505 a genuine cross-case shared entity.
The fixture writes directly to Neo4j using the existing client.

Usage:
    python load_cross_case_fixture.py
"""
import sys, os
sys.path.insert(0, os.path.abspath('src/backend'))
from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.graph.neo4j_client import Neo4jClient

FIXTURE_CYPHER = [
    # --- CASE-105 (already exists, but we merge to be safe) ---
    # Person
    "MERGE (p:PERSON {id: 'B-005'}) SET p.name='Neha Sharma', p.confidence=0.95",
    # Phone (shared with CASE-204)
    "MERGE (ph:PHONE {id: 'P-505'}) SET ph.name='Phone P-505'",
    # Vehicle, Location, Org
    "MERGE (v:VEHICLE {id: 'V-031'}) SET v.name='Vehicle V-031'",
    "MERGE (l:LOCATION {id: 'L-030'}) SET l.name='Residential Area'",
    "MERGE (org:ORGANIZATION {id: 'ORG-11'}) SET org.name='Organization ORG-11'",
    # Case node
    "MERGE (c:CASE {id: 'CASE-105'}) SET c.name='CASE-105'",
    # Relationships
    "MATCH (p:PERSON {id: 'B-005'}), (c:CASE {id: 'CASE-105'}) MERGE (p)-[:INVOLVED_IN]->(c)",
    "MATCH (p:PERSON {id: 'B-005'}), (ph:PHONE {id: 'P-505'}) MERGE (p)-[:USED_PHONE {timestamp: '2026-08-20T08:00:00', source_record_id: 'REC-105-1', confidence: 0.95}]->(ph)",
    "MATCH (p:PERSON {id: 'B-005'}), (v:VEHICLE {id: 'V-031'}) MERGE (p)-[:USED_VEHICLE {timestamp: '2026-08-20T09:00:00', source_record_id: 'REC-105-2', confidence: 0.9}]->(v)",
    "MATCH (p:PERSON {id: 'B-005'}), (l:LOCATION {id: 'L-030'}) MERGE (p)-[:VISITED_LOCATION {timestamp: '2026-08-20T10:00:00', source_record_id: 'REC-105-3', confidence: 0.85}]->(l)",
    "MATCH (p:PERSON {id: 'B-005'}), (org:ORGANIZATION {id: 'ORG-11'}) MERGE (p)-[:AFFILIATED_WITH {timestamp: '2026-08-20T11:00:00', source_record_id: 'REC-105-4', confidence: 0.8}]->(org)",

    # --- CASE-204: Priya Kapoor, shares P-505 with CASE-105 ---
    "MERGE (p2:PERSON {id: 'D-204'}) SET p2.name='Priya Kapoor', p2.confidence=0.9",
    "MERGE (l2:LOCATION {id: 'L-204'}) SET l2.name='Market Street'",
    "MERGE (v2:VEHICLE {id: 'V-204'}) SET v2.name='Vehicle V-204'",
    "MERGE (c2:CASE {id: 'CASE-204'}) SET c2.name='CASE-204'",
    # Relationships — Priya uses the SAME phone P-505
    "MATCH (p2:PERSON {id: 'D-204'}), (c2:CASE {id: 'CASE-204'}) MERGE (p2)-[:INVOLVED_IN]->(c2)",
    "MATCH (p2:PERSON {id: 'D-204'}), (ph:PHONE {id: 'P-505'}) MERGE (p2)-[:USED_PHONE {timestamp: '2026-09-01T14:00:00', source_record_id: 'REC-204-1', confidence: 0.88}]->(ph)",
    "MATCH (p2:PERSON {id: 'D-204'}), (l2:LOCATION {id: 'L-204'}) MERGE (p2)-[:VISITED_LOCATION {timestamp: '2026-09-01T15:00:00', source_record_id: 'REC-204-2', confidence: 0.85}]->(l2)",
    "MATCH (p2:PERSON {id: 'D-204'}), (v2:VEHICLE {id: 'V-204'}) MERGE (p2)-[:USED_VEHICLE {timestamp: '2026-09-01T16:00:00', source_record_id: 'REC-204-3', confidence: 0.9}]->(v2)",
]

def load_fixture():
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    try:
        with client.driver.session() as session:
            for cypher in FIXTURE_CYPHER:
                session.run(cypher)
        print("Cross-case fixture loaded successfully.")
        print("  CASE-105: Neha Sharma (B-005) with phone P-505")
        print("  CASE-204: Priya Kapoor (D-204) with SAME phone P-505  <- cross-case link")
        print("  P-505 is now a genuine cross-case shared entity.")
    finally:
        client.close()

if __name__ == "__main__":
    load_fixture()
