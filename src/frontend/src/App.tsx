import { Routes, Route, Navigate } from 'react-router-dom';
import CaseList from './pages/CaseList';
import CaseWorkspace from './pages/CaseWorkspace';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import './styles/dashboard.css';

function App() {
  const { token } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={token ? <CaseList /> : <Navigate to="/login" />} />
      <Route path="/cases/:id" element={token ? <CaseWorkspace /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
