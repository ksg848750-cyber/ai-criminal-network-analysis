import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvestigativeGraph from '../components/InvestigativeGraph';
import NavigationPanel from '../components/NavigationPanel';
import AIPanel from '../components/AIPanel';
import { useAuth } from '../context/AuthContext';
import type { GraphData, Lead } from '../types/api';
import '../styles/dashboard.css';
import { Activity, Loader2, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const CaseWorkspace: React.FC = () => {
  const { id: caseId } = useParams<{ id: string }>();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any | null>(null);
  const [selectionType, setSelectionType] = useState<'node' | 'edge' | 'lead' | null>(null);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedSourceRecordId, setSelectedSourceRecordId] = useState<string | null>(null);
  const [highlightedElementIds, setHighlightedElementIds] = useState<string[]>([]);
  const [focusedPattern, setFocusedPattern] = useState<any>(null);

  const fetchWorkspaceData = async () => {
    if (!token || !caseId) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const graphRes = await fetch(`${API_BASE_URL}/cases/${caseId}/graph`, { headers });
      if (graphRes.status === 401) { logout(); navigate('/login'); return; }
      if (!graphRes.ok) throw new Error('Failed to fetch case graph');
      const graph = await graphRes.json();
      setGraphData(graph);

      const leadsRes = await fetch(`${API_BASE_URL}/cases/${caseId}/leads`, { headers });
      if (!leadsRes.ok) throw new Error('Failed to fetch case leads');
      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads);
      
      const timeRes = await fetch(`${API_BASE_URL}/cases/${caseId}/timeline`, { headers });
      if (timeRes.ok) {
        const timeData = await timeRes.json();
        setTimeline(timeData.timeline);
      }
      
      const intelRes = await fetch(`${API_BASE_URL}/cases/${caseId}/intelligence`, { headers });
      if (intelRes.ok) {
        const intelData = await intelRes.json();
        setIntelligence(intelData);
      }
      
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to Intelligence API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [token, caseId]);

  const handleVerify = async (leadId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${leadId}/verify`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchWorkspaceData();
    } catch (err) {
      console.error('Verify failed', err);
    }
  };

  const handleReject = async (leadId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${leadId}/reject`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchWorkspaceData();
    } catch (err) {
      console.error('Reject failed', err);
    }
  };

  useEffect(() => {
    if (selectionType === 'edge' && selectedData?.source_record_id) {
      const el = document.getElementById(`timeline-event-${selectedData.source_record_id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectionType, selectedData]);
  
  const handlePatternAction = (pattern: any, action: 'SHOW_ON_GRAPH' | 'VIEW_TIMELINE') => {
    if (action === 'SHOW_ON_GRAPH') {
      setFocusedPattern(pattern);
      const edgeIds = graphData?.edges
        .filter(e => pattern.supporting_records?.includes(e.data.source_record_id))
        .map(e => e.data.id) || [];
      setHighlightedElementIds([...(pattern.involved_entities || []), ...edgeIds]);
      setActiveLead(null);
      setSelectedSourceRecordId(null);
    } else if (action === 'VIEW_TIMELINE') {
      setFocusedPattern(pattern);
      if (pattern.supporting_records && pattern.supporting_records.length > 0) {
        const targetId = pattern.supporting_records[0];
        setSelectedSourceRecordId(targetId);
        setTimeout(() => {
          const el = document.getElementById(`timeline-event-${targetId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  const handleAIAction = (action: any) => {
    switch (action.type) {
      case 'HIGHLIGHT_NODES':
        setHighlightedElementIds(action.target_ids || []);
        break;
      case 'SHOW_TIMELINE_EVENT':
        if (action.target_ids && action.target_ids.length > 0) {
            setSelectedSourceRecordId(action.target_ids[0]);
            const el = document.getElementById(`timeline-event-${action.target_ids[0]}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      case 'SHOW_LEAD':
      case 'SHOW_EVIDENCE':
      case 'SHOW_CROSS_CASE':
      case 'FOCUS_ENTITY':
      case 'EXPAND_ENTITY':
        console.log(`Action ${action.type} recognized but requires pending UI/product integration.`);
        break;
      default:
        console.log("Unhandled AI action:", action);
    }
  };

  /*
   * CaseWorkspace lives inside AppShell > workspace.
   * The workspace container is already 100% height and overflow:hidden.
   * This component uses flex to fill it without causing page scroll.
   *  - case-subheader: fixed-height title bar
   *  - main body: 3-column (nav | graph+timeline | AI)
   *    - left panel:   independent overflow-y via NavigationPanel internals
   *    - center:       graph (flex-grow) stacked above timeline (fixed 220px)
   *    - right panel:  AIPanel manages its own scroll
   */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Case sub-header */}
      <div className="case-subheader">
        <button onClick={() => navigate('/cases')} className="back-btn">
          <ArrowLeft size={15} /> Back to Cases
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
          <Activity size={17} color="var(--accent-primary)" />
          CASE WORKSPACE: <span style={{ color: 'var(--accent-primary)', marginLeft: 4 }}>{caseId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--status-green)', display: 'inline-block' }} />
            ACTIVE
          </span>
          {graphData && (
            <span>
              <strong style={{ color: 'var(--text-main)' }}>{graphData.nodes.length}</strong> Entities &nbsp;|&nbsp;
              <strong style={{ color: 'var(--text-main)' }}>{graphData.edges.length}</strong> Connections
            </span>
          )}
        </div>
      </div>

      {/* Main 3-column body */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Navigation/Lead panel */}
        <div style={{ width: 300, minWidth: 300, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
          <NavigationPanel 
            graphData={graphData} 
            leads={leads} 
            intelligence={intelligence}
            onLeadSelect={(lead) => {
              setActiveLead(lead);
              if (lead) {
                setSelectionType('lead');
                setSelectedData(null);
                setSelectedSourceRecordId(null);
                setHighlightedElementIds([]);
                setFocusedPattern(null);
              } else {
                setSelectionType(null);
              }
            }} 
            activeLeadId={activeLead?.id || null}
            onPatternAction={handlePatternAction}
          />
        </div>

        {/* Center: graph (flex-grow) + timeline (fixed 220px) */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          {/* Graph */}
          <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={22} style={{ marginRight: 10 }} /> Initializing case intelligence...
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--status-red)', gap: 8 }}>
                <p>{error}</p>
              </div>
            ) : graphData?.nodes.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <p>No intelligence graph available for this case.</p>
              </div>
            ) : (
              <InvestigativeGraph 
                data={graphData} 
                onElementSelect={(type, data) => {
                  setSelectionType(type);
                  setSelectedData(data);
                  setSelectedSourceRecordId(null);
                  if (type) {
                    setActiveLead(null);
                    setHighlightedElementIds([]);
                    setFocusedPattern(null);
                  }
                }} 
                activeLead={activeLead}
                selectedSourceRecordId={selectedSourceRecordId}
                highlightedElementIds={highlightedElementIds}
              />
            )}
          </div>

          {/* Timeline — 220px fixed, independent scroll */}
          <div style={{ 
            height: 220, minHeight: 220, flexShrink: 0,
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-panel)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '8px 16px 6px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Activity Timeline
              </span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 16px', flexGrow: 1 }}>
              {timeline.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No chronological events found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {timeline.map((evt, idx) => {
                    const matchingPattern = intelligence?.patterns.find((p: any) => 
                      p.finding_type === 'TEMPORAL_BURST' && 
                      evt.timestamp.startsWith(p.time_window) &&
                      idx === timeline.findIndex((e: any) => e.timestamp.startsWith(p.time_window))
                    );
                    return (
                      <React.Fragment key={idx}>
                        {matchingPattern && (
                          <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderLeft: '2px solid #ef4444', padding: '5px 10px', borderRadius: 3 }}>
                            <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 'bold' }}>⚠ TEMPORAL BURST DETECTED</div>
                            <div style={{ color: 'var(--text-main)', fontSize: '0.78rem' }}>{matchingPattern.reason}</div>
                          </div>
                        )}
                        <div 
                          id={`timeline-event-${evt.source_record_id}`}
                          onClick={() => setSelectedSourceRecordId(selectedSourceRecordId === evt.source_record_id ? null : evt.source_record_id)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '5px 8px',
                            backgroundColor: selectedSourceRecordId === evt.source_record_id || (selectionType === 'edge' && selectedData?.source_record_id === evt.source_record_id) || focusedPattern?.supporting_records?.includes(evt.source_record_id) ? 'var(--bg-panel-hover)' : 'transparent',
                            borderRadius: 3,
                            borderLeft: focusedPattern?.supporting_records?.includes(evt.source_record_id) ? '2px solid #06b6d4' : '2px solid var(--accent-primary)',
                            cursor: 'pointer', transition: 'background-color 0.15s'
                          }}
                        >
                          <span style={{ color: '#06b6d4', fontSize: '0.72rem', minWidth: 75 }}>{evt.timestamp}</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.82rem' }}>{evt.person_name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', backgroundColor: 'var(--bg-panel-hover)', padding: '1px 5px', borderRadius: 3 }}>{evt.action}</span>
                          <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>{evt.target_name} ({evt.target_type})</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Rec: {evt.source_record_id}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Panel — scroll managed inside AIPanel */}
        {caseId && (
          <AIPanel 
            caseId={caseId || ''} 
            onAction={handleAIAction} 
            contextData={{ selectionType, selectedData, activeLead }}
            intelligence={intelligence}
            onVerify={handleVerify}
            onReject={handleReject}
            onPatternAction={handlePatternAction}
          />
        )}
      </div>
    </div>
  );
};

export default CaseWorkspace;
