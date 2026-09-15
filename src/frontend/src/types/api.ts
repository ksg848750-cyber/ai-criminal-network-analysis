export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  source_record_id: string;
}

export interface Relationship {
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
  source_record_id: string;
}

export interface LeadEvidence {
  source_record_id: string;
  description: string;
}

export interface Lead {
  id: string;
  entity_a: string;
  entity_a_name: string;
  entity_b: string;
  entity_b_name: string;
  score: number;
  reasons: string[];
  evidence: LeadEvidence[];
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  is_cross_case?: boolean;
}

export interface AuditRecord {
  id: string;
  lead_id: string;
  action: 'VERIFY' | 'REJECT';
  evidence_hash: string;
  timestamp: string;
}

export interface GraphData {
  nodes: { data: Record<string, any> }[];
  edges: { data: Record<string, any> }[];
}
