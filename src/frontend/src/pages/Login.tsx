import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      login(data.access_token, username, data.role);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0a0f18',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#111827',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #1f2937'
      }}>
        <h2 style={{ color: '#06b6d4', marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>
          Criminal Network Intelligence
        </h2>
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#f3f4f6',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#f3f4f6',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#0891b2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#06b6d4'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0891b2'}
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
