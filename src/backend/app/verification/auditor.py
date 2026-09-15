import hashlib
import json
import logging
from app.models.intelligence import Lead, VerificationAudit

logger = logging.getLogger(__name__)

class VerificationAuditor:
    def __init__(self):
        # In a real app, this would persist to a secure database
        self.audits = []

    def verify_lead(self, lead: Lead, action: str, reviewer: str = "System") -> VerificationAudit:
        """
        Processes a verification action (VERIFY or REJECT) on a lead,
        generating a SHA-256 hash of the evidence for integrity.
        """
        if action not in ["VERIFY", "REJECT"]:
            raise ValueError("Action must be VERIFY or REJECT")
            
        # Serialize the evidence bundle consistently
        evidence_data = [e.model_dump() for e in lead.evidence]
        bundle = {
            "lead_id": lead.id,
            "entity_a": lead.entity_a,
            "entity_b": lead.entity_b,
            "score": lead.score,
            "reasons": lead.reasons,
            "evidence": evidence_data,
            "action": action,
            "reviewer": reviewer
        }
        
        # Consistent JSON string serialization
        serialized = json.dumps(bundle, sort_keys=True)
        
        # Generate SHA-256
        evidence_hash = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
        
        audit = VerificationAudit(
            lead_id=lead.id,
            action=action,
            evidence_hash=evidence_hash,
            reviewer=reviewer
        )
        
        # Update lead status
        if action == "VERIFY":
            lead.status = "VERIFIED"
        elif action == "REJECT":
            lead.status = "REJECTED"
            
        self.audits.append(audit)
        logger.info(f"Generated Audit Record: Action={action}, Lead={lead.id}, Hash={evidence_hash}")
        
        return audit
