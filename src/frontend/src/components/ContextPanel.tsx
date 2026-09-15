import React, { useState, useEffect } from 'react';
import type { Lead, AuditRecord } from '../types/api';
import { ShieldAlert, ShieldCheck, AlertOctagon, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000';

interface ContextPanelProps {
  selectionType: 'node' | 'edge' | 'lead' | null;
  selectedData: any | null;
  activeLead: Lead | null;
  graphData: any;
  leads: Lead[];
  onVerify: (leadId: string) => void;
  onReject: (leadId: string) => void;
  audits: Record<string, AuditRecord>;
}

const ContextPanel: React.FC<ContextPanelProps> = ({ 
  selectionType, 
  selectedData, 
  activeLead,
  graphData,
  leads,
  onVerify, 
  onReject, 
  audits 
}) => {
  const [entityDetails, setEntityDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (selectionType === 'node' && selectedData) {
      fetchEntity(selectedData.id);
    } else {
      setEntityDetails(null);
    }
  }, [selectionType, selectedData]);

  const fetchEntity = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/entities/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntityDetails(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!selectionType) {
    return (
      <div className="panel-right">
        <h2>Case Intelligence</h2>
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{graphData?.nodes.length || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ENTITIES</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{graphData?.edges.length || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RELATIONSHIPS</div>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{leads.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OPEN LEADS</div>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Select an entity, relationship, or lead to view detailed intelligence context.
        </p>
      </div>
    );
  }

  if (selectionType === 'lead' && activeLead) {
    const audit = audits[activeLead.id];
    return (
      <div className="panel-right">
        <h2>Analytical Lead</h2>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {activeLead.status === 'PENDING_VERIFICATION' && <ShieldAlert size={18} color="var(--status-amber)" />}
                {activeLead.status === 'VERIFIED' && <ShieldCheck size={18} color="var(--status-green)" />}
                {activeLead.status === 'REJECTED' && <AlertOctagon size={18} color="var(--status-red)" />}
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{activeLead.entity_a_name} ↔ {activeLead.entity_b_name}</h3>
              </div>
              {activeLead.is_cross_case && (
                <span className="badge" style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#d97706', border: '1px solid #d97706', marginTop: '4px' }}>
                  Cross-Case Lead
                </span>
              )}
            </div>
            <span className={`badge ${activeLead.score >= 20 ? 'amber' : ''}`}>Score: {activeLead.score}</span>
          </div>
          
          <div style={{ marginBottom: '16px', marginTop: '16px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Why This Lead?</p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '16px' }}>
              {activeLead.reasons.map((reason, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{reason}</li>
              ))}
            </ul>
            
            <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Supporting Records</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {activeLead.evidence.map((ev, idx) => (
                <span key={idx} className="badge" style={{ margin: 0 }}>{ev.source_record_id}</span>
              ))}
            </div>
          </div>

          {activeLead.status === 'PENDING_VERIFICATION' ? (
            <div style={{ marginTop: '24px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600 }}>REQUIRES INVESTIGATOR VERIFICATION</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-verify" onClick={() => onVerify(activeLead.id)} style={{ flex: 1 }}>Verify</button>
                <button className="btn btn-reject" onClick={() => onReject(activeLead.id)} style={{ flex: 1 }}>Reject</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', borderLeft: `3px solid var(--status-${activeLead.status === 'VERIFIED' ? 'green' : 'red'})` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} color={`var(--status-${activeLead.status === 'VERIFIED' ? 'green' : 'red'})`} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>STATUS: {activeLead.status}</span>
              </div>
              {audit && (
                <div>
                  <p style={{ fontSize: '0.75rem', margin: '0 0 4px 0', color: 'var(--text-muted)' }}>AUDIT HASH (SHA-256)</p>
                  <p style={{ fontSize: '0.75rem', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-main)', margin: 0 }}>{audit.evidence_hash}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectionType === 'node' && selectedData) {
    return (
      <div className="panel-right">
        <h2>Entity Intelligence</h2>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={16} /> Fetching entity data...
          </div>
        ) : entityDetails ? (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge">{entityDetails.type}</span>
                {selectedData.is_cross_case && (
                  <span className="badge" style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#d97706', border: '1px solid #d97706' }}>
                    Cross-Case Connection
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{entityDetails.name}</h3>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>ID: {entityDetails.id}</p>
            </div>
            
            {entityDetails.properties && Object.keys(entityDetails.properties).length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Properties</h3>
                <ul className="entity-list" style={{ marginTop: '12px' }}>
                  {Object.entries(entityDetails.properties).map(([key, value]) => (
                    <li key={key} className="entity-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all', marginLeft: '12px' }}>{String(value as any)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card">
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Source Provenance</h3>
              <div style={{ marginTop: '12px' }}>
                <span className="badge">{entityDetails.source_record_id || 'UNKNOWN'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (selectionType === 'edge' && selectedData) {
    return (
      <div className="panel-right">
        <h2>Relationship Intelligence</h2>
        <div className="card">
          <div style={{ marginBottom: '20px' }}>
            <span className="badge">{selectedData.type}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontWeight: 600 }}>{selectedData.source}</span>
              <ArrowRight size={16} color="var(--text-muted)" />
              <span style={{ fontWeight: 600 }}>{selectedData.target}</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Date / Time</h3>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedData.timestamp || 'Unknown'}</p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Source Record</h3>
            <span className="badge">{selectedData.source_record_id || 'UNKNOWN'}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ContextPanel;
