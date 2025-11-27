import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayOut';
import Login from './page/Login';
import JobList from './role admin/JobList';
import Dashboard from './role admin/Dashboard';
import TechnicianDashboard from './role technician/TechnicianDashboard';
import AdminCreateJobPage from './role admin/AdminCreateJobPage';
import TechnicianWorkSheetForm from './role technician/TechnicianWorkSheetForm';
import TechnicianWorkSheetPrint from './role technician/TechnicianWorkSheetPrint';
import JobDetail from './role admin/JobDetail';
import Typejob from './role admin/Typejob';
import Settings from './role admin/Settings';
import ExecDashboard from './role executive/ExecDashboard';
import ExecSettings from './role executive/ExecSettings';

const RoleRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  let target = '/admin/dashboard';
  if (user.role === 'technician') target = '/tech/dashboard';
  if (user.role === 'executive') target = '/executive/dashboard';
  return <Navigate to={target} replace />;
};

const ProtectedLayout = ({ requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout role={user.role} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/Techjob-27">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route element={<ProtectedLayout requiredRole="admin" />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/joblist" element={<JobList />} />
            <Route path="/admin/job/:id" element={<JobDetail />} />
            <Route path="/admin/create-job" element={<Typejob />} />
            <Route path="/admin/create-job/ma" element={<AdminCreateJobPage />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          <Route element={<ProtectedLayout requiredRole="technician" />}>
            <Route path="/tech/dashboard" element={<TechnicianDashboard />} />
            <Route path="/tech/create-job" element={<AdminCreateJobPage />} />
            <Route path="/tech/work-sheet" element={<TechnicianWorkSheetForm />} />
            <Route path="/tech/work-sheet/print" element={<TechnicianWorkSheetPrint />} />
          </Route>

          <Route element={<ProtectedLayout requiredRole="executive" />}>
            <Route path="/executive/dashboard" element={<ExecDashboard />} />
            <Route path="/executive/settings" element={<ExecSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
