import React from 'react';
import GlobalHeader from './GlobalHeader';
import Sidebar from './Sidebar';
import '../../styles/dashboard.css';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="app-shell">
      <GlobalHeader />
      <div className="app-body">
        <Sidebar />
        <main className="workspace">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
