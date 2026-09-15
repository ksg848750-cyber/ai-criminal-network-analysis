import React from 'react';
import type { Lead, GraphData } from '../types/api';
import { ShieldAlert, ShieldCheck, AlertOctagon, Network, ExternalLink, Activity } from 'lucide-react';

interface NavigationPanelProps {
  graphData: GraphData | null;
  leads: Lead[];
  intelligence: any;
  onLeadSelect: (lead: Lead | null) => void;
  activeLeadId: string | null;
  onPatternAction: (pattern: any, action: 'SHOW_ON_GRAPH' | 'VIEW_TIMELINE') => void;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({ graphData, leads, intelligence, onLeadSelect, activeLeadId, onPatternAction }) => {
  return (
    <div className="panel-left" style={{ overflowY: 'auto' }}>
      <h2 style={{ fontSize: '0.9rem', letterSpacing: '1px', marginBottom: '16px' }}>INTELLIGENCE OVERVIEW</h2>
      
      {intelligence ? (
        <>
          <div className="card" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
               <div style={{ textAlign: 'center', flex: 1 }}>
                 <div style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{Object.values(intelligence.summary.entity_counts).reduce((a: any, b: any) => a + b, 0) as number}</div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entities</div>
               </div>
               <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
               <div style={{ textAlign: 'center', flex: 1 }}>
                 <div style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{graphData?.edges.length || 0}</div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connections</div>
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: intelligence.patterns.length > 0 ? '#06b6d4' : 'var(--text-muted)', fontWeight: intelligence.patterns.length > 0 ? 'bold' : 'normal' }}>
                {intelligence.patterns.length} PATTERN{intelligence.patterns.length !== 1 ? 'S' : ''} DETECTED
              </div>
              <div style={{ fontSize: '0.75rem', color: intelligence.summary.cross_case_entities.length > 0 ? '#d97706' : 'var(--text-muted)', fontWeight: intelligence.summary.cross_case_entities.length > 0 ? 'bold' : 'normal' }}>
                {intelligence.summary.cross_case_entities.length} CROSS-CASE LINK{intelligence.summary.cross_case_entities.length !== 1 ? 'S' : ''}
              </div>
            </div>
          </div>

          {intelligence.summary.key_entities.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Network size={14} /> Key Entities
              </h3>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {intelligence.summary.key_entities.map((ke: any) => (
                  <div key={ke.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#e2e8f0' }}>{ke.name}</span>
                    <span style={{ color: '#06b6d4', fontWeight: 600 }}>{ke.degree} connections</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {intelligence.summary.cross_case_entities.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', borderColor: 'rgba(217, 119, 6, 0.3)' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExternalLink size={14} /> Cross-Case Entities
              </h3>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {intelligence.summary.cross_case_entities.map((ce: any) => (
                  <div key={ce.id} style={{ fontSize: '0.8rem', padding: '4px' }}>
                    <span style={{ color: '#e2e8f0', display: 'block' }}>{ce.name} ({ce.type})</span>
                    <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Found in: {ce.other_cases.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {intelligence.patterns.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '8px' }}>
                <Activity size={14} /> Analytical Findings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {intelligence.patterns.map((pat: any, idx: number) => (
                  <div key={idx} style={{ padding: '8px', backgroundColor: 'rgba(6, 182, 212, 0.05)', borderLeft: '2px solid #06b6d4', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 'bold', marginBottom: '4px' }}>⚠ {pat.finding_type.replace('_', ' ')}</div>
                    <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '4px' }}>{pat.description}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '8px' }}>Reason: {pat.reason}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => onPatternAction(pat, 'SHOW_ON_GRAPH')}
                        style={{ fontSize: '0.65rem', padding: '4px 8px', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        [SHOW ON GRAPH]
                      </button>
                      <button 
                        onClick={() => onPatternAction(pat, 'VIEW_TIMELINE')}
                        style={{ fontSize: '0.65rem', padding: '4px 8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        [VIEW TIMELINE]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Loading intelligence...</div>
      )}
      
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Analytical Leads ({leads.length})
      </h3>
      
      {leads.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>No analytical leads detected.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '1rem' }}>
          {leads.map(lead => (
            <div 
              key={lead.id} 
              className="card" 
              style={{ 
                cursor: 'pointer',
                marginBottom: 0,
                padding: '12px',
                borderColor: activeLeadId === lead.id ? 'var(--accent-primary)' : 'var(--border-color)',
                boxShadow: activeLeadId === lead.id ? '0 0 0 1px var(--accent-primary)' : 'none'
              }}
              onClick={() => onLeadSelect(activeLeadId === lead.id ? null : lead)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {lead.status === 'PENDING_VERIFICATION' && <ShieldAlert size={14} color="var(--status-amber)" />}
                {lead.status === 'VERIFIED' && <ShieldCheck size={14} color="var(--status-green)" />}
                {lead.status === 'REJECTED' && <AlertOctagon size={14} color="var(--status-red)" />}
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {lead.entity_a_name} ↔ {lead.entity_b_name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${lead.score >= 20 ? 'amber' : ''}`} style={{ margin: 0, fontSize: '0.65rem' }}>
                  Score: {lead.score}
                </span>
                {lead.is_cross_case && (
                  <span style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 'bold' }}>CROSS-CASE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavigationPanel;
