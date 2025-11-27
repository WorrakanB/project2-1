import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './TechnicianSetting.css';

export default function TechnicianSetting() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState({
    darkMode: false,
    notifications: true,
    autoSync: true,
    sort: 'newest',
  });

  const handleToggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="tech-setting-page">
      <header className="tech-setting-topbar">
        <h1>Setting</h1>
      </header>

      <div className="tech-setting-grid">
        <section className="tech-card">
          <div className="card-header">
            <p>ข้อมูลบัญชีช่าง</p>
          </div>
          <div className="profile-row">
            <div className="profile-avatar">T</div>
            <div className="profile-info">
              <p className="profile-name">{user?.name || 'Technician Name'}</p>
              <p className="profile-sub">รหัสช่าง: tech-03</p>
              <p className="profile-sub">เบอร์โทร: 090-000-0000</p>
              <p className="profile-sub">ทักษะ/แผนก: Network</p>
            </div>
            <button className="ghost-btn" type="button">Edit profile</button>
          </div>
        </section>

        <section className="tech-card">
          <div className="card-header">
            <p>การตั้งค่าการทำงาน</p>
          </div>
          <div className="setting-row">
            <span>Enable dark mode</span>
            <button
              type="button"
              className={`toggle ${prefs.darkMode ? 'on' : ''}`}
              onClick={() => handleToggle('darkMode')}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span>Receive job notification alerts</span>
            <button
              type="button"
              className={`toggle ${prefs.notifications ? 'on' : ''}`}
              onClick={() => handleToggle('notifications')}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span>Auto-sync job calendar</span>
            <button
              type="button"
              className={`toggle ${prefs.autoSync ? 'on' : ''}`}
              onClick={() => handleToggle('autoSync')}
            >
              <span />
            </button>
          </div>
          <div className="setting-row column">
            <label htmlFor="sort">Default job sorting</label>
            <select
              id="sort"
              value={prefs.sort}
              onChange={(e) => setPrefs((prev) => ({ ...prev, sort: e.target.value }))}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="card-actions">
            <button className="primary-btn" type="button">Save</button>
          </div>
        </section>

        <section className="tech-card system-card">
          <div className="card-header">
            <p>System Settings</p>
          </div>
          <div className="system-actions">
            <button type="button" className="soft-btn">Change password</button>
            <button type="button" className="soft-btn">Check app version</button>
            <button type="button" className="soft-btn">Clear cached data</button>
          </div>
        </section>
      </div>
    </div>
  );
}
