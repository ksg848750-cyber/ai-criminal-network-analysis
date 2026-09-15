import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Folder, Users, Link as LinkIcon, AlertTriangle, Upload, Loader2, ArrowRight } from 'lucide-react';
import UploadModal from '../components/UploadModal';

interface CaseSummary {
  id: string;
  name: string;
  date: string;
  description: string;
  entity_count: number;
  relationship_count: number;
  open_lead_count: number;
  pattern_count: number;
  cross_case_link_count: number;
  last_activity: string;
}

const CaseList: React.FC = () => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchCases = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/cases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch cases');
      const data = await res.json();
      setCases(data.cases);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [token]);

  return (
    <div className="workspace-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ color: '#06b6d4', margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Folder size={32} />
            Active Investigations
          </h1>
          <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>Select a case to enter the intelligence workspace.</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#0891b2', color: 'white',
              border: 'none', padding: '0.75rem 1.25rem',
              borderRadius: '4px', cursor: 'pointer',
              fontWeight: 500, transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#06b6d4'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0891b2'}
          >
            <Upload size={18} /> New Investigation / Upload Data
          </button>
        )}
      </header>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={fetchCases} />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9ca3af' }}>
          <Loader2 className="animate-spin" size={32} style={{ marginRight: '12px' }}/> Loading cases...
        </div>
      ) : error ? (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: '#111827', borderRadius: '8px', border: '1px dashed #374151', color: '#9ca3af' }}>
          <Folder size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>No Active Investigations</h3>
          {user?.role === 'ADMIN' ? (
            <p>Click "New Investigation / Upload Data" to begin.</p>
          ) : (
            <p>Waiting for an administrator to upload case data.</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {cases.map((c) => (
            <div 
              key={c.id} 
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => navigate(`/cases/${c.id}`)}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0891b2';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#1f2937';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.25rem' }}>{c.id}</h2>
                <span style={{ 
                  backgroundColor: 'rgba(6, 182, 212, 0.1)', 
                  color: '#06b6d4', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  border: '1px solid rgba(6, 182, 212, 0.2)'
                }}>
                  ACTIVE
                </span>
              </div>
              
              {c.description && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                  {c.description}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #1f2937', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                  <Users size={16} color="#64748b" /> {c.entity_count} Entities
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                  <LinkIcon size={16} color="#64748b" /> {c.relationship_count} Connections
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: c.pattern_count > 0 ? '#06b6d4' : '#64748b', fontSize: '0.875rem', fontWeight: c.pattern_count > 0 ? 600 : 400 }}>
                  <AlertTriangle size={16} /> {c.pattern_count} Pattern{c.pattern_count !== 1 ? 's' : ''} Detected
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: c.cross_case_link_count > 0 ? '#d97706' : '#64748b', fontSize: '0.875rem', fontWeight: c.cross_case_link_count > 0 ? 600 : 400 }}>
                  <LinkIcon size={16} /> {c.cross_case_link_count} Cross-Case Link{c.cross_case_link_count !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: c.open_lead_count > 0 ? '#ef4444' : '#64748b', fontSize: '0.875rem', fontWeight: c.open_lead_count > 0 ? 600 : 400 }}>
                  <AlertTriangle size={16} /> {c.open_lead_count} Analytical Lead{c.open_lead_count !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {c.last_activity ? (
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Last Activity: {c.last_activity}</span>
                ) : (
                  <span></span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#0891b2', fontSize: '0.875rem', fontWeight: 500 }}>
                  Open Investigation <ArrowRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseList;
