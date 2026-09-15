import React from 'react';
import { NavLink } from 'react-router-dom';
import { Globe, Network, Folder, Upload, ShieldAlert, Search } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Globe size={18} />
          <span>Global Intelligence</span>
        </NavLink>
        <NavLink to="/explorer" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Network size={18} />
          <span>Network Explorer</span>
        </NavLink>
        <NavLink to="/cases" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Folder size={18} />
          <span>Active Cases</span>
        </NavLink>
        <NavLink to="/ingest" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Upload size={18} />
          <span>Data Ingestion</span>
        </NavLink>
        <NavLink to="/audit" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <ShieldAlert size={18} />
          <span>Audit</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Search size={18} />
          <span>Global Search</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
