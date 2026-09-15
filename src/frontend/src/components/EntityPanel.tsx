import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface EntityPanelProps {
  selectedNode: any | null;
}

const API_BASE_URL = 'http://localhost:8000';

const EntityPanel: React.FC<EntityPanelProps> = ({ selectedNode }) => {
  const [entityData, setEntityData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!selectedNode) {
      setEntityData(null);
      return;
    }

    const fetchEntity = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/entities/${selectedNode.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch entity details');
        const data = await res.json();
        setEntityData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [selectedNode]);

  return (
    <div className="panel-left">
      <h2>Entity Details</h2>
      
      {!selectedNode ? (
        <p>Select a node in the intelligence graph to view its properties and source provenance.</p>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={16} /> Fetching entity data...
        </div>
      ) : error ? (
        <p style={{ color: 'var(--status-red)' }}>Error: {error}</p>
      ) : entityData ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <span className="badge">{entityData.type}</span>
              {selectedNode.is_cross_case && (
                <span className="badge" style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#d97706', border: '1px solid #d97706' }}>
                  Cross-Case Connection
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{entityData.name}</h3>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>ID: {entityData.id}</p>
          </div>
          
          <div className="card">
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Properties</h3>
            {entityData.properties && Object.keys(entityData.properties).length > 0 ? (
              <ul className="entity-list" style={{ marginTop: '12px' }}>
                {Object.entries(entityData.properties).map(([key, value]) => (
                  <li key={key} className="entity-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                    <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all', marginLeft: '12px' }}>{String(value as any)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No additional properties.</p>
            )}
          </div>

          {entityData.relationships && entityData.relationships.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Relationships ({entityData.relationships.length})</h3>
              <ul className="entity-list" style={{ marginTop: '12px' }}>
                {entityData.relationships.map((rel: any, idx: number) => (
                  <li key={idx} className="entity-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="badge" style={{ margin: 0 }}>{rel.relationship_type}</span>
                      <span style={{ fontSize: '0.85rem' }}>{rel.connected_entity_name || rel.connected_entity_id}</span>
                    </div>
                    {rel.timestamp && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rel.timestamp}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="card">
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Source Provenance</h3>
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              Extracted from record:
            </p>
            <span className="badge" style={{ marginTop: '4px' }}>{entityData.source_record_id || 'UNKNOWN'}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EntityPanel;
