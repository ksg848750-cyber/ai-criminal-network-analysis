from fastapi import HTTPException
from app.config import settings
from app.ingestion.loader import load_and_normalize_records
from app.extraction.extractor import Extractor
from app.resolution.resolver import Resolver
from app.graph.neo4j_client import Neo4jClient
from app.analysis.scorer import Scorer, ScoringConfig
from app.evidence.tracker import EvidenceTracker
from app.state import set_leads  # We will create this

def run_ingestion_pipeline(filepath: str):
    # 1. Ingestion
    raw_records = load_and_normalize_records(filepath)
    if not raw_records:
        raise HTTPException(status_code=400, detail="Failed to load records")
        
    # 2. Extraction
    extractor = Extractor()
    entities, relationships = extractor.extract(raw_records)
    
    # 3. Resolution
    resolver = Resolver()
    final_entities, final_relationships = resolver.resolve(entities, relationships)
    
    # 4. Graph Construction
    client = Neo4jClient(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    client.clear_database()  # Reset for MVP pipeline demo
    client.load_entities_and_relationships(final_entities, final_relationships)
    client.close()
    
    # 5. Graph Analysis & Scoring
    scorer = Scorer(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD, ScoringConfig())
    raw_connections = scorer.detect_potential_connections()
    
    # 6. Evidence Generation
    tracker = EvidenceTracker()
    leads = tracker.generate_leads(raw_connections)
    
    # Store in memory for MVP
    set_leads({l.id: l for l in leads})
    
    return {
        "message": "Pipeline completed successfully",
        "records_processed": len(raw_records),
        "entities_resolved": len(final_entities),
        "relationships_created": len(final_relationships),
        "leads_generated": len(leads)
    }
