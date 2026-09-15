from pydantic import BaseModel
from typing import Optional
from enum import Enum

class RelationshipType(str, Enum):
    INVOLVED_IN = "INVOLVED_IN"
    USES = "USES"
    CALLS = "CALLS"
    VISITS = "VISITS"
    OWNS = "OWNS"
    WORKS_FOR = "WORKS_FOR"
    TRANSFERS_TO = "TRANSFERS_TO"
    DRIVES = "DRIVES"

class Relationship(BaseModel):
    source_entity_id: str
    target_entity_id: str
    type: RelationshipType
    source_record_id: Optional[str] = None
    timestamp: Optional[str] = None
    confidence: float = 1.0
