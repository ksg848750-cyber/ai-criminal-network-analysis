import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InvestigativeGraph from '../components/InvestigativeGraph';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const GlobalNetworkExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [globalGraph, setGlobalGraph] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const graphRes = await fetch(`${API_BASE_URL}/network/global-graph`, { headers });
        if (graphRes.status === 401) { logout(); navigate('/login'); return; }
        if (!graphRes.ok) throw new Error(`Global Graph API error: ${graphRes.status}`);
        const graphData = await graphRes.json();
        setGlobalGraph(graphData);
      } catch (err: any) {
        console.error('GlobalNetworkExplorer fetch error:', err);
        setError(err.message || 'Unknown error loading global graph');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [token, navigate, logout]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={22} style={{ marginRight: 10 }} /> Loading Global Network...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--status-red)', gap: 8 }}>
        <h4>Unable to load global network</h4>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Explorer header */}
      <div style={{
        padding: '10px 20px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Global Network Explorer</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Full-screen interactive network exploration
        </span>
      </div>

      {/* Graph + optional details panel */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Graph fills available space */}
        <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          {globalGraph && globalGraph.nodes && globalGraph.nodes.length > 0 ? (
            <InvestigativeGraph
              data={globalGraph}
              onElementSelect={(_, data) => setSelectedElement(data)}
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No network relationships available.
            </div>
          )}
        </div>

        {/* Optional selection details panel */}
        {selectedElement && (
          <div style={{
            width: 280, minWidth: 280, flexShrink: 0,
            borderLeft: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-panel)',
            padding: '16px',
            overflowY: 'auto'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Selection Details</h4>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</div>
              <div style={{ fontSize: '0.9rem' }}>{selectedElement.name || selectedElement.label || selectedElement.type || 'Unknown'}</div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedElement.id}</div>
            </div>
            {selectedElement.label && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</div>
                <div style={{ fontSize: '0.9rem' }}>{selectedElement.label}</div>
              </div>
            )}
            {selectedElement.source_record_id && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Source</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedElement.source_record_id}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalNetworkExplorer;
