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
      
      // Fetch scoped graph
      const graphRes = await fetch(`${API_BASE_URL}/cases/${caseId}/graph`, { headers });
      if (graphRes.status === 401) { logout(); navigate('/login'); return; }
      if (!graphRes.ok) throw new Error('Failed to fetch case graph');
      const graph = await graphRes.json();
      setGraphData(graph);

      // Fetch scoped leads
      const leadsRes = await fetch(`${API_BASE_URL}/cases/${caseId}/leads`, { headers });
      if (!leadsRes.ok) throw new Error('Failed to fetch case leads');
      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads);
      
      // Fetch timeline
      const timeRes = await fetch(`${API_BASE_URL}/cases/${caseId}/timeline`, { headers });
      if (timeRes.ok) {
        const timeData = await timeRes.json();
        setTimeline(timeData.timeline);
      }
      
      // Fetch intelligence summary
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

  // Listen to selection changes to sync timeline highlighting if an edge is selected
  useEffect(() => {
    if (selectionType === 'edge' && selectedData?.source_record_id) {
      const el = document.getElementById(`timeline-event-${selectedData.source_record_id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectionType, selectedData]);
  
  const handlePatternAction = (pattern: any, action: 'SHOW_ON_GRAPH' | 'VIEW_TIMELINE') => {
    if (action === 'SHOW_ON_GRAPH') {
      setFocusedPattern(pattern);
      // We want to highlight the involved entities, plus the edges that match the supporting records
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

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'transparent', color: '#9ca3af',
              border: '1px solid #374151', padding: '4px 10px',
              borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={16} /> Back to Cases
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', color: '#f3f4f6', fontSize: '1.25rem', fontWeight: 600 }}>
            <Activity size={20} color="var(--accent-primary)" style={{ marginRight: '10px' }} />
            INVESTIGATION WORKSPACE: <span className="accent" style={{ marginLeft: '6px' }}>{caseId}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                ACTIVE
            </div>
            {graphData && (
                <div style={{ color: '#9ca3af' }}>
                    <strong style={{ color: '#e2e8f0' }}>{graphData.nodes.length}</strong> Entities | 
                    <strong style={{ color: '#e2e8f0', marginLeft: '6px' }}>{graphData.edges.length}</strong> Connections
                </div>
            )}
        </div>
      </header>
      
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
      
      <main style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Graph Area */}
        <div style={{ flexGrow: 1, position: 'relative' }}>
            {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={24} style={{ marginRight: '12px' }}/> Initializing case intelligence...
            </div>
            ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--status-red)' }}>
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
        
        {/* Timeline Area at Bottom */}
        <div style={{ 
            height: '25%', minHeight: '200px', backgroundColor: 'var(--panel-bg)', 
            borderTop: '1px solid var(--border-color)', padding: '1rem', overflowY: 'auto'
        }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#9ca3af', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Activity Timeline
            </h3>
            {timeline.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No chronological events found.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {timeline.map((evt, idx) => {
                        // Check if we need to inject a pattern marker before this event
                        const matchingPattern = intelligence?.patterns.find((p: any) => 
                            p.finding_type === 'TEMPORAL_BURST' && 
                            evt.timestamp.startsWith(p.time_window) &&
                            idx === timeline.findIndex((e: any) => e.timestamp.startsWith(p.time_window))
                        );

                        return (
                          <React.Fragment key={idx}>
                            {matchingPattern && (
                              <div style={{ 
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '2px solid #ef4444', 
                                  padding: '8px 12px', margin: '4px 0', borderRadius: '4px',
                                  display: 'flex', flexDirection: 'column', gap: '4px'
                              }}>
                                <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  ⚠ TEMPORAL BURST DETECTED
                                </div>
                                <div style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>
                                  {matchingPattern.reason}
                                </div>
                              </div>
                            )}
                            <div 
                                id={`timeline-event-${evt.source_record_id}`}
                                onClick={() => setSelectedSourceRecordId(selectedSourceRecordId === evt.source_record_id ? null : evt.source_record_id)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '1rem', 
                                    padding: '0.5rem', backgroundColor: selectedSourceRecordId === evt.source_record_id || (selectionType === 'edge' && selectedData?.source_record_id === evt.source_record_id) || focusedPattern?.supporting_records?.includes(evt.source_record_id) ? '#374151' : '#1f2937', 
                                    borderRadius: '4px',
                                    borderLeft: focusedPattern?.supporting_records?.includes(evt.source_record_id) ? '2px solid #06b6d4' : '2px solid var(--accent-primary)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <span style={{ color: '#06b6d4', fontSize: '0.75rem', minWidth: '80px' }}>{evt.timestamp}</span>
                                <span style={{ color: '#f3f4f6', fontWeight: 500, fontSize: '0.875rem' }}>{evt.person_name}</span>
                                <span style={{ color: '#9ca3af', fontSize: '0.75rem', backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px' }}>{evt.action}</span>
                                <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{evt.target_name} ({evt.target_type})</span>
                                <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.75rem' }}>Record: {evt.source_record_id}</span>
                            </div>
                          </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
      </main>
      
      {/* AI Chat Panel replaces ContextPanel as the right sidebar */}
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
  );
};

export default CaseWorkspace;
