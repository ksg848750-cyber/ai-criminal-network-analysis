from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Evidence(BaseModel):
    source_record_id: str
    description: str = "Source record supporting the connection."

class Lead(BaseModel):
    id: str
    entity_a: str
    entity_b: str
    entity_a_name: str
    entity_b_name: str
    score: int
    reasons: List[str]
    evidence: List[Evidence]
    status: str = "PENDING_VERIFICATION"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class VerificationAudit(BaseModel):
    lead_id: str
    action: str  # "VERIFY" or "REJECT"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    evidence_hash: str
    reviewer: str = "System"
