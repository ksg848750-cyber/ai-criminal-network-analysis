import { Routes, Route, Navigate } from 'react-router-dom';
import CaseList from './pages/CaseList';
import CaseWorkspace from './pages/CaseWorkspace';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import './styles/dashboard.css';

import GlobalIntelligenceCenter from './pages/GlobalIntelligenceCenter';
import GlobalNetworkExplorer from './pages/GlobalNetworkExplorer';

const DataIngestion = () => (
  <div className="placeholder-page">
    <h2>Data Ingestion</h2>
    <p>Implementation Pending</p>
  </div>
);

const Audit = () => (
  <div className="placeholder-page">
    <h2>Audit Log</h2>
    <p>Implementation Pending</p>
  </div>
);

const GlobalSearch = () => (
  <div className="placeholder-page">
    <h2>Global Search</h2>
    <p>Implementation Pending</p>
  </div>
);

function App() {
  const { token } = useAuth();
  
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<GlobalIntelligenceCenter />} />
        <Route path="/explorer" element={<GlobalNetworkExplorer />} />
        <Route path="/cases" element={<CaseList />} />
        <Route path="/cases/:id" element={<CaseWorkspace />} />
        <Route path="/ingest" element={<DataIngestion />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/search" element={<GlobalSearch />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppShell>
  );
}

export default App;
