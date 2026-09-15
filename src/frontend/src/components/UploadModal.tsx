import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    
    if (user?.role !== 'ADMIN') {
      setError('Only administrators can upload data.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Format validation errors nicely
        if (errorData.detail?.errors) {
            setError(errorData.detail.errors.join('\n'));
        } else {
            setError(errorData.detail?.message || errorData.detail || 'Upload failed');
        }
        setIsUploading(false);
        return;
      }

      setIsUploading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error during upload');
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '8px',
        padding: '2rem',
        width: '400px',
        color: '#e2e8f0'
      }}>
        <h3 style={{ color: '#06b6d4', marginTop: 0 }}>Upload Intelligence Data</h3>
        
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            whiteSpace: 'pre-wrap',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#f3f4f6'
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Format must include: case_id, person_id, person_name, event_date, event_type, location, associated_vehicle, associated_organization
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '1px solid #374151',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0891b2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isUploading ? 'wait' : 'pointer',
              opacity: isUploading ? 0.7 : 1
            }}
            disabled={isUploading}
          >
            {isUploading ? 'Processing...' : 'Upload & Ingest'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
