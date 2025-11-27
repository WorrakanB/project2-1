import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AppLayout from './layouts/AppLayOut';
import Login from './page/Login';
import JobList from './role admin/JobList';
import Dashboard from './role admin/Dashboard';
import DashboardT from './role technician/TechnicianDashboard';
// import Report from './role technician/TechnicianReport';
import CreateWS from './role technician/AdminCreateJobPage';

const RedirectToDashboard = () => <Navigate to="/dashboard" replace />;

function App() {
  return (
    <BrowserRouter basename="/Techjob-27">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardT/>} />
          <Route path="joblist" element={<JobList />} />
          <Route path="Reports" element={<Report/>} />
          <Route path="Create" element={<CreateWS />} />
        </Route>
        <Route path="*" element={<RedirectToDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
