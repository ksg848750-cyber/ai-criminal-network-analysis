import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InvestigativeGraph from '../components/InvestigativeGraph';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const GlobalIntelligenceCenter: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [intelligence, setIntelligence] = useState<any>(null);
  const [globalGraph, setGlobalGraph] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Intelligence
        const intRes = await fetch(`${API_BASE_URL}/network/intelligence`, { headers });
        if (intRes.status === 401) { logout(); navigate('/login'); return; }
        if (!intRes.ok) throw new Error(`Intelligence API error: ${intRes.status}`);
        const intData = await intRes.json();
        setIntelligence(intData);

        // Fetch Global Graph
        const graphRes = await fetch(`${API_BASE_URL}/network/global-graph`, { headers });
        if (graphRes.status === 401) { logout(); navigate('/login'); return; }
        if (!graphRes.ok) throw new Error(`Global Graph API error: ${graphRes.status}`);
        const graphData = await graphRes.json();
        setGlobalGraph(graphData);

      } catch (err: any) {
        console.error('GlobalIntelligenceCenter fetch error:', err);
        setError(err.message || 'Unknown error loading global intelligence');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, [token, navigate, logout]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={22} style={{ marginRight: 10 }} /> Loading Global Intelligence...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--status-red)', gap: 8 }}>
        <h4>Unable to load global intelligence</h4>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  const totalEntities = intelligence?.network?.total_entities ?? '—';
  const totalRelationships = intelligence?.network?.total_relationships ?? '—';
  const clusterCount = intelligence?.clusters?.length ?? 0;
  const openLeadCount = intelligence?.analytical_leads?.open?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Metrics Bar */}
      <div style={{
        display: 'flex', gap: '24px', padding: '10px 20px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Entities</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalEntities}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Relationships</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalRelationships}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Network Clusters</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#06B6D4' }}>{clusterCount}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Analytical Leads</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#F59E0B' }}>{openLeadCount}</div>
        </div>
      </div>

      {/* Main body: graph + intelligence sidebar */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Graph Area — dominant, fills remaining space */}
        <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          {globalGraph && globalGraph.nodes && globalGraph.nodes.length > 0 ? (
            <InvestigativeGraph data={globalGraph} />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No network relationships available.
            </div>
          )}
        </div>

        {/* Intelligence Sidebar */}
        <div style={{
          width: 320, minWidth: 320, flexShrink: 0,
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-panel)',
          overflowY: 'auto',
          padding: '16px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Global Intelligence</h3>

          {/* Highly Connected Entities */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.85rem' }}>Highly Connected Entities</h4>
            {intelligence?.highly_connected_entities?.length > 0 ? (
              intelligence.highly_connected_entities.map((entity: any) => (
                <div key={entity.id} style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{entity.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({entity.type})</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connections: {entity.degree}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No highly connected entities identified.</div>
            )}
          </div>

          {/* Potential Network Clusters */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#06B6D4', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.85rem' }}>Potential Network Clusters</h4>
            {intelligence?.clusters?.length > 0 ? (
              intelligence.clusters.map((cluster: any) => (
                <div key={cluster.id} style={{ marginBottom: '10px', padding: '8px', backgroundColor: 'var(--bg-panel-hover)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cluster.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cluster.size} connected entities</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No clusters identified in the current dataset.</div>
            )}
          </div>

          {/* Bridge Entities */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#F59E0B', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.85rem' }}>Bridge Entities</h4>
            {intelligence?.bridge_entities?.length > 0 ? (
              intelligence.bridge_entities.map((be: any) => (
                <div key={be.id} style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{be.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({be.type})</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Betweenness: {be.betweenness_score}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No significant bridge entities identified.</div>
            )}
          </div>

          {/* Cross-Case Entities */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#EF4444', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.85rem' }}>Cross-Case Entities</h4>
            {intelligence?.cross_case_entities?.length > 0 ? (
              intelligence.cross_case_entities.map((cce: any) => (
                <div key={cce.id} style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{cce.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({cce.type})</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cases: {cce.cases.join(', ')}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No cross-case entities identified in the current dataset.</div>
            )}
          </div>

          {/* Temporal Intelligence */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--accent-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.85rem' }}>Temporal Activity</h4>
            {intelligence?.temporal?.total_events > 0 ? (
              <div style={{ fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>First event:</span> {intelligence.temporal.first_event}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Last event:</span> {intelligence.temporal.last_event}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total events:</span> {intelligence.temporal.total_events}</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No temporal data available.</div>
            )}
          </div>

          {/* Analytical Leads */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#F59E0B', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.85rem' }}>Analytical Leads</h4>
            {openLeadCount > 0 ? (
              intelligence.analytical_leads.open.map((lead: any) => (
                <div key={lead.id} style={{ marginBottom: '8px', padding: '6px', backgroundColor: 'var(--bg-panel-hover)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 500 }}>{lead.entity_a} ↔ {lead.entity_b}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.lead_type} · {lead.status}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No open analytical leads.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default GlobalIntelligenceCenter;
