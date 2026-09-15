import React from 'react';
import type { Lead, AuditRecord } from '../types/api';
import { ShieldAlert, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface LeadPanelProps {
  leads: Lead[];
  onVerify: (leadId: string) => void;
  onReject: (leadId: string) => void;
  audits: Record<string, AuditRecord>;
  onLeadSelect: (lead: Lead | null) => void;
  activeLeadId: string | null;
}

const LeadPanel: React.FC<LeadPanelProps> = ({ leads, onVerify, onReject, audits, onLeadSelect, activeLeadId }) => {
  if (!leads || leads.length === 0) {
    return (
      <div className="panel-right">
        <h2>Potential Connections</h2>
        <p>No analytical leads detected in the current dataset.</p>
      </div>
    );
  }

  return (
    <div className="panel-right">
      <h2>Potential Connections <span className="accent">({leads.length})</span></h2>
      <p style={{marginBottom: '20px'}}>Machine-generated intelligence leads requiring investigator review.</p>

      {leads.map(lead => {
        const audit = audits[lead.id];
        
        return (
          <div 
            key={lead.id} 
            className="card" 
            style={{ 
              cursor: 'pointer',
              borderColor: activeLeadId === lead.id ? 'var(--accent-primary)' : 'var(--border-color)',
              boxShadow: activeLeadId === lead.id ? '0 0 0 1px var(--accent-primary)' : 'var(--shadow-panel)'
            }}
            onClick={() => onLeadSelect(activeLeadId === lead.id ? null : lead)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {lead.status === 'PENDING_VERIFICATION' && <ShieldAlert size={18} color="var(--status-amber)" />}
                  {lead.status === 'VERIFIED' && <ShieldCheck size={18} color="var(--status-green)" />}
                  {lead.status === 'REJECTED' && <AlertOctagon size={18} color="var(--status-red)" />}
                  
                  <h3 style={{ margin: 0 }}>
                    {lead.entity_a_name} ↔ {lead.entity_b_name}
                  </h3>
                </div>
                {lead.is_cross_case && (
                  <span className="badge" style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#d97706', border: '1px solid #d97706', marginTop: '4px', display: 'inline-block' }}>
                    Cross-Case Lead
                  </span>
                )}
              </div>
              <span className={`badge ${lead.score >= 20 ? 'amber' : ''}`}>
                Score: {lead.score}
              </span>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>Reasons</p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                {lead.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              
              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>Supporting Source Records</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {lead.evidence.map((ev, idx) => (
                  <span key={idx} className="badge" style={{ margin: 0 }}>{ev.source_record_id}</span>
                ))}
              </div>
            </div>

            {lead.status === 'PENDING_VERIFICATION' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button 
                  className="btn" 
                  onClick={(e) => { e.stopPropagation(); onVerify(lead.id); }}
                  style={{ flex: 1, backgroundColor: 'var(--status-green)', color: '#000' }}
                >
                  Verify Connection
                </button>
                <button 
                  className="btn" 
                  onClick={(e) => { e.stopPropagation(); onReject(lead.id); }}
                  style={{ flex: 1, backgroundColor: 'var(--status-red)', color: '#fff' }}
                >
                  Reject
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', borderLeft: `3px solid var(--status-${lead.status === 'VERIFIED' ? 'green' : 'red'})` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <CheckCircle2 size={14} color={`var(--status-${lead.status === 'VERIFIED' ? 'green' : 'red'})`} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    STATUS: {lead.status}
                  </span>
                </div>
                {audit && (
                  <div>
                    <p style={{ fontSize: '0.75rem', margin: '0 0 4px 0' }}>AUDIT HASH (SHA-256)</p>
                    <p style={{ fontSize: '0.7rem', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-main)', margin: 0 }}>
                      {audit.evidence_hash}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LeadPanel;
