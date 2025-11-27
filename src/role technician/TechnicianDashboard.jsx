import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { loadJobs, saveJobs } from '../utils/jobStorage';
import './TechnicianDashboard.css';

const filters = ['สถานะงานของฉัน', 'ประเภทงาน', 'ความเร่งด่วน', 'ช่วงเวลา'];

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const buildArc = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

function PieChart({ data }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cursor = 0;

  return (
    <div className="tech-pie-card">
      <div className="tech-pie-shell">
        <svg viewBox="0 0 220 220" className="tech-pie-svg">
          <circle cx="110" cy="110" r="90" fill="#d8f3dc" />
          {data.map((item) => {
            const slice = total ? (item.value / total) * 360 : 0;
            const start = cursor;
            const end = cursor + slice;
            cursor = end;
            return (
              <path
                key={item.key}
                d={buildArc(110, 110, 90, start, end)}
                stroke={item.color}
                strokeWidth="32"
                fill="none"
              />
            );
          })}
          <circle cx="110" cy="110" r="46" fill="#fff" />
        </svg>
        <div className="tech-pie-center">
          <p className="tech-pie-total">{total}</p>
          <p className="tech-pie-sub">งานทั้งหมด</p>
        </div>
      </div>
      <div className="tech-legend">
        {data.map((item) => (
          <div key={item.key} className="tech-legend-row">
            <span className="tech-legend-dot" style={{ background: item.color }} />
            <div>
              <p className="tech-legend-label">{item.label}</p>
              <p className="tech-legend-meta">{item.value} งาน</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const statusClass = (status) => {
  if (!status) return 'neutral';
  if (status === 'done' || status === 'เสร็จแล้ว') return 'success';
  if (status === 'rejected' || status === 'returned') return 'danger';
  if (status === 'canceled' || status === 'ยกเลิก') return 'cancel';
  if (status === 'in_progress' || status === 'กำลังทำ') return 'warn';
  return 'neutral';
};

const isLate = (job) => {
  if (!job?.dueDate) return false;
  const due = new Date(job.dueDate).getTime();
  const now = Date.now();
  const closed = job.status === 'done' || job.status === 'canceled';
  return !closed && due < now;
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
};

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { jobs: ctxJobs } = useJobs();
  const navigate = useNavigate();
  const [range, setRange] = useState('week');

  if (!user || user.role !== 'technician') {
    return <Navigate to="/login" replace />;
  }

  // รวม jobs จาก storage + context
  const mergedJobs = useMemo(() => {
    const stored = loadJobs();
    const byId = new Map();
    stored.forEach((j) => byId.set(j.id, j));
    ctxJobs.forEach((j) => byId.set(j.id, j));
    return Array.from(byId.values());
  }, [ctxJobs]);

  useEffect(() => {
    if (ctxJobs && ctxJobs.length) {
      saveJobs(ctxJobs);
    }
  }, [ctxJobs]);

  // candidate id ของช่าง
  const techCandidates = useMemo(() => {
    const base = [user?.id, user?.username, user?.name].filter(Boolean);
    if (user?.username === 'tech') {
      base.push('tech-01', 'tech-02', 'tech-03', 'tech-04');
    }
    return new Set(base.map((t) => String(t).toLowerCase()));
  }, [user]);

  const isMine = (job) => {
    const main = String(job?.mainTechnicianId || job?.mainTechnician || '').toLowerCase();
    const assistants = [
      ...(job?.assistantTechnicianIds || []),
      ...(job?.technicians || []),
    ].map((t) => String(t).toLowerCase());
    if (techCandidates.has(main)) return true;
    return assistants.some((id) => techCandidates.has(id));
  };

  const myJobs = useMemo(
    () => mergedJobs.filter((job) => isMine(job)),
    [mergedJobs, techCandidates],
  );

  const filteredByRange = useMemo(() => {
    const now = new Date();
    const rangeStart = (() => {
      if (range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (range === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (range === 'year') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return null;
    })();
    if (!rangeStart) return myJobs;
    return myJobs.filter((job) => {
      const openedAt = job.openedAt ? new Date(job.openedAt) : null;
      const due = job.dueDate ? new Date(job.dueDate) : null;
      const inRange =
        (openedAt && openedAt >= rangeStart) ||
        (due && due >= rangeStart);
      return inRange;
    });
  }, [myJobs, range]);

  const kpiCounts = useMemo(() => {
    const today = filteredByRange.filter(
      (j) => (j.dueDate && isToday(j.dueDate)) && !(j.status === 'done' || j.status === 'canceled'),
    ).length;
    const inProgress = filteredByRange.filter((j) => j.status === 'in_progress').length;
    const done = filteredByRange.filter((j) => j.status === 'done').length;
    const returned = filteredByRange.filter((j) => j.status === 'rejected' || j.status === 'returned').length;
    const late = filteredByRange.filter(isLate).length;
    return {
      total: filteredByRange.length,
      today,
      inProgress,
      done,
      returned,
      late,
    };
  }, [filteredByRange]);

  const pieData = useMemo(() => {
    const mapStatus = [
      { key: 'new', label: 'New', match: (s) => s === 'new', color: '#5db7ff' },
      { key: 'in_progress', label: 'In Progress', match: (s) => s === 'in_progress', color: '#1b9a5f' },
      { key: 'pending_review', label: 'Pending Review', match: (s) => s === 'pending_review' || s === 'waiting_approval', color: '#f5c542' },
      { key: 'completed', label: 'Completed', match: (s) => s === 'done', color: '#0f8b4a' },
      { key: 'returned', label: 'Returned / Rejected', match: (s) => s === 'rejected' || s === 'returned', color: '#f59e42' },
    ];
    return mapStatus.map((m) => ({
      key: m.key,
      label: m.label,
      color: m.color,
      value: filteredByRange.filter((j) => m.match(j.status)).length,
    }));
  }, [filteredByRange]);

  const todayTasks = useMemo(
    () =>
      filteredByRange.filter(
        (job) =>
          !(job.status === 'done' || job.status === 'canceled') &&
          (isToday(job.dueDate) || job.status === 'in_progress' || isLate(job)),
      ),
    [filteredByRange],
  );

  const recentReturned = useMemo(
    () =>
      filteredByRange
        .filter((j) => j.status === 'rejected' || j.status === 'returned')
        .sort((a, b) => new Date(b.updatedAt || b.openedAt || 0) - new Date(a.updatedAt || a.openedAt || 0)),
    [filteredByRange],
  );

  const monthDone = useMemo(() => {
    const now = new Date();
    return filteredByRange.filter((j) => {
      if (j.status !== 'done') return false;
      if (!j.dueDate) return false;
      const d = new Date(j.dueDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [filteredByRange]);

  const kpis = [
    { label: 'งานทั้งหมดของฉัน', value: String(kpiCounts.total || 0), delta: '' },
    { label: 'งานวันนี้', value: String(kpiCounts.today || 0), delta: '' },
    { label: 'กำลังดำเนินการ', value: String(kpiCounts.inProgress || 0), delta: '' },
    { label: 'งานเสร็จแล้ว', value: String(kpiCounts.done || 0), delta: '' },
    { label: 'งานที่ถูกตีกลับ', value: String(kpiCounts.returned || 0), delta: '' },
    { label: 'งานล่าช้า', value: String(kpiCounts.late || 0), delta: '' },
  ];

  const formatDue = (due) => (due ? new Date(due).toLocaleDateString('th-TH') : '-');

  return (
    <div className="tech-dashboard-page">
      <div className="tech-dashboard-shell">
        <header className="tech-header">
          <h1 className="tech-title">Dashboard</h1>
        </header>

        <section className="tech-filter-bar">
          <div className="tech-filter-group">
            {filters.map((f) => (
              <button key={f} className="tech-filter-chip">
                {f} ▾
              </button>
            ))}
          </div>
          <div className="tech-filter-range">
            <button
              className={`tech-filter-pill ${range === 'week' ? 'active' : ''}`}
              onClick={() => setRange('week')}
            >
              สัปดาห์
            </button>
            <button
              className={`tech-filter-pill ${range === 'month' ? 'active' : ''}`}
              onClick={() => setRange('month')}
            >
              เดือน
            </button>
            <button
              className={`tech-filter-pill ${range === 'year' ? 'active' : ''}`}
              onClick={() => setRange('year')}
            >
              ปี
            </button>
          </div>
        </section>

        <section className="tech-kpi-grid">
          {kpis.map((kpi, idx) => (
            <article
              key={kpi.label}
              className={`tech-kpi-card ${idx === 0 ? 'primary' : ''}`}
            >
              <p className="tech-kpi-label">{kpi.label}</p>
              <div className="tech-kpi-value-row">
                <p className="tech-kpi-value">{kpi.value}</p>
                {kpi.delta ? <span className="tech-kpi-delta">{kpi.delta}</span> : null}
              </div>
            </article>
          ))}
        </section>

        <div className="tech-separator" />

        <section className="tech-charts-row">
          <article className="tech-chart-card">
            <div className="tech-chart-header">
              <p className="tech-chart-title">สถานะงานของฉัน</p>
            </div>
            <PieChart data={pieData} />
          </article>
          <article className="tech-chart-card">
            <div className="tech-chart-header">
              <p className="tech-chart-title">ผลงานตามช่วงเวลา</p>
              <div className="chart-toggle">
                <button
                  className={`tech-filter-pill ${range === 'week' ? 'active' : ''}`}
                  onClick={() => setRange('week')}
                >
                  สัปดาห์
                </button>
                <button
                  className={`tech-filter-pill ${range === 'month' ? 'active' : ''}`}
                  onClick={() => setRange('month')}
                >
                  เดือน
                </button>
              </div>
            </div>
            <div className="tech-chart-placeholder tall">Bar Chart – จำนวนงานของฉันในแต่ละสัปดาห์/เดือน</div>
          </article>
        </section>

        <section className="tech-two-column">
          <article className="tech-panel">
            <div className="tech-panel-header">
              <p className="tech-panel-title">งานวันนี้และงานค้างของฉัน</p>
            </div>
            <div className="tech-task-list">
              {todayTasks.length === 0 && <p className="tech-empty">ยังไม่มีงานวันนี้</p>}
              {todayTasks.map((task, idx) => (
                <div key={task.id} className={`tech-task-item ${idx === 0 ? 'filled' : ''}`}>
                  <div className="tech-task-meta">
                    <p className="tech-task-id">{task.id}</p>
                    <p className="tech-task-customer">{task.customer || '-'}</p>
                  </div>
                  <div className="tech-task-info">
                    <span className={`tech-status-badge ${statusClass(task.status)}`}>
                      {task.status || '-'}
                    </span>
                    <span className="tech-status-badge neutral">กำหนดส่ง: {formatDue(task.dueDate)}</span>
                    <span className={`tech-status-badge ${task.priority?.includes('สูง') ? 'danger' : 'neutral'}`}>
                      ความเร่งด่วน: {task.priority || '-'}
                    </span>
                  </div>
                  <button
                    className="tech-action-btn"
                    onClick={() => navigate(`/technician/job/${encodeURIComponent(task.id)}`)}
                  >
                    ดูรายละเอียดงาน
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="tech-panel">
            <div className="tech-panel-header">
              <p className="tech-panel-title">งานที่ถูกตีกลับ / ต้องแก้ไข</p>
            </div>
            <div className="tech-reject-list">
              {recentReturned.length === 0 && <p className="tech-empty">ยังไม่มีงานที่ถูกตีกลับ</p>}
              {recentReturned.map((item) => (
                <div key={item.id} className="tech-reject-item">
                  <div className="tech-reject-main">
                    <p className="tech-task-id">{item.id}</p>
                    <p className="tech-task-customer">{item.customer || '-'}</p>
                    <p className="tech-reject-note">หมายเหตุ: {item.requirementDetail || '—'}</p>
                  </div>
                  <div className="tech-reject-meta">
                    <span className={`tech-status-badge ${statusClass(item.status)}`}>สถานะ: {item.status || '-'}</span>
                    <span className={`tech-status-badge ${item.priority?.includes('สูง') ? 'danger' : 'neutral'}`}>
                      ความเร่งด่วน: {item.priority || '-'}
                    </span>
                    <span className="tech-timestamp">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString('th-TH') : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="tech-bottom-row">
          <article className="tech-achievement-card">
            <p className="tech-panel-title">ความภาคภูมิใจของช่าง / สรุปผลงาน</p>
            <div className="tech-achievement-grid">
              <div className="tech-achievement-tile">
                <p className="tech-kpi-label">งานเสร็จสิ้นเดือนนี้</p>
                <p className="tech-kpi-value">{monthDone} งาน</p>
                <p className="tech-kpi-delta">สรุปจากงานที่ปิดสำเร็จ</p>
              </div>
              <div className="tech-achievement-tile">
                <p className="tech-kpi-label">งานล่าช้าที่ต้องติดตาม</p>
                <p className="tech-kpi-value">{kpiCounts.late}</p>
                <p className="tech-kpi-delta">เร่งติดตามภายในวันนี้</p>
              </div>
              <div className="tech-achievement-tile">
                <p className="tech-kpi-label">งานถูกตีกลับ</p>
                <p className="tech-kpi-value">{kpiCounts.returned}</p>
                <p className="tech-kpi-delta">ดำเนินการแก้ไขให้ครบ</p>
              </div>
              <div className="tech-achievement-tile">
                <p className="tech-kpi-label">ความคืบหน้าส่วนบุคคล</p>
                <p className="tech-kpi-delta">อัปเดตงานใน Dashboard</p>
              </div>
            </div>
          </article>

          <article className="tech-calendar-card">
            <p className="tech-panel-title">ปฏิทินงาน (ย่อ)</p>
            <ul className="tech-calendar-list">
              <li>พรุ่งนี้ – ตรวจงาน / ปิดงานที่ค้าง</li>
              <li>สัปดาห์นี้ – เร่งปิดงานล่าช้า</li>
              <li>เดือนนี้ – สรุปผลการทำงาน</li>
              <li>ซิงก์ปฏิทินจากระบบมือถือ</li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
