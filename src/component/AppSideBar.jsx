import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppSideBar.css';
import joblistLogo from '../../pic/joblist-logo.png';
import dashboardIcon from '../../pic/dashboard.png';
import createJobIcon from '../../pic/createjob.png';
import settingIcon from '../../pic/setting.png';

const adminNav = [
  { label: 'Dashboard', to: '/admin/dashboard', badge: null, icon: dashboardIcon },
  { label: 'Joblist', to: '/admin/joblist', badge: null, icon: joblistLogo },
  { label: 'Create Job', to: '/admin/create-job', badge: null, icon: createJobIcon },
  { label: 'Settings', to: '/admin/settings', badge: null, icon: settingIcon },
];

const techNav = [
  { label: 'Dashboard', to: '/tech/dashboard', badge: null, icon: dashboardIcon },
  { label: 'Create Job', to: '/tech/create-job', badge: null, icon: createJobIcon },
  { label: 'Work Sheet', to: '/tech/work-sheet', badge: null },
  { label: 'Print Work Sheet', to: '/tech/work-sheet/print', badge: null },
];

const executiveNav = [
  { label: 'Dashboard', to: '/executive/dashboard', badge: null, icon: dashboardIcon },
  { label: 'Settings', to: '/executive/settings', badge: null, icon: settingIcon },
];

const AppSideBar = ({ role }) => {
  const navItems =
    role === 'technician' ? techNav : role === 'executive' ? executiveNav : adminNav;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" />

      <div className="sidebar-section">
        <p className="sidebar-section-label">Menu</p>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.label} className="sidebar-nav-item">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-link-main">
                  {item.icon ? (
                    <img src={item.icon} alt="" className="sidebar-link-icon" />
                  ) : (
                    <span className="sidebar-link-dot" aria-hidden="true" />
                  )}
                  <span className="sidebar-link-label">{item.label}</span>
                </span>
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <button className="sidebar-logout-btn" type="button" onClick={handleLogout}>
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSideBar;
