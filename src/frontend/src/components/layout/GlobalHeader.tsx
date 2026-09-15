import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, LogOut } from 'lucide-react';

const GlobalHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="global-header">
      <div className="brand">
        <Shield size={20} className="brand-icon" />
        <span className="brand-text">CINAP</span>
        <span className="brand-subtext">| AI-Powered Intelligence</span>
      </div>
      <div className="header-actions">
        {user && (
          <div className="user-profile">
            <User size={16} />
            <span className="user-name">{user.username} ({user.role})</span>
            <button onClick={logout} className="logout-btn" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default GlobalHeader;
