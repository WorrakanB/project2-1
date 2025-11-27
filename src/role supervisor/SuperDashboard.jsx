import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../context/JobsContext';
import './SuperDashboard.css';

const statusPalette = [
  { key: 'new', label: 'New', color: '#1c2632' },
  { key: 'in_progress', label: 'In Progress', color: '#2b3b52' },
  { key: 'done', label: 'Done', color: '#3d5d8e' },
  { key: 'rejected', label: 'Rejected', color: '#4d78cf' },
  { key: 'canceled', label: 'Canceled', color: '#4785fc' },
];

const formatNumber = (value) => value.toLocaleString('th-TH');
const formatShortDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Dashboard() {
  const { jobs } = useJobs();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    department: 'all',
    customer: 'all',
    type: 'all',
    status: 'all',
    range: 'week',
  });

  const filterOptions = useMemo(() => {
    const departments = new Set();
    const customers = new Set();
    const types = new Set();
    jobs.forEach((job) => {
      if (job.department) departments.add(job.department);
      if (job.customer) customers.add(job.customer);
      if (job.type) types.add(job.type);
    });
    return {
      department: ['all', ...Array.from(departments)],
      customer: ['all', ...Array.from(customers)],
      type: ['all', ...Array.from(types)],
      status: ['all', ...statusPalette.map((s) => s.key)],
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const now = new Date();
    const rangeStart = (() => {
      if (filters.range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (filters.range === 'month') return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      if (filters.range === 'year') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return null;
    })();

    return jobs.filter((job) => {
      const matchDepartment = filters.department === 'all' || job.department === filters.department;
      const matchCustomer = filters.customer === 'all' || job.customer === filters.customer;
      const matchType = filters.type === 'all' || job.type === filters.type;
      const matchStatus = filters.status === 'all' || job.status === filters.status;
      const matchRange =
        !rangeStart ||
        !job.openedAt ||
        (new Date(job.openedAt).getTime() >= rangeStart.getTime());
      return matchDepartment && matchCustomer && matchType && matchStatus && matchRange;
    });
  }, [filters, jobs]);

  const kpiCards = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const counts = filteredJobs.reduce(
      (acc, job) => {
        acc.total += 1;
        acc[job.status] = (acc[job.status] || 0) + 1;

        const openedAt = job.openedAt ? new Date(job.openedAt) : null;
        if (openedAt && openedAt >= sevenDaysAgo) {
          acc.newThisWeek += 1;
        }

        const due = job.dueDate ? new Date(job.dueDate) : null;
        const isClosed = job.status === 'done' || job.status === 'canceled' || job.status === 'rejected';
        if (due && due < now && !isClosed) {
          acc.late += 1;
        }
        return acc;
      },
      { total: 0, new: 0, newThisWeek: 0, in_progress: 0, done: 0, rejected: 0, canceled: 0, late: 0 },
    );

    return [
      { label: 'Total Work Orders', value: formatNumber(counts.total), delta: `${formatNumber(counts.newThisWeek)} opened this week` },
      { label: 'New This Week', value: formatNumber(counts.newThisWeek), delta: `${formatNumber(counts.new)} currently new` },
      { label: 'In Progress', value: formatNumber(counts.in_progress), delta: `${formatNumber(counts.late)} overdue` },
      { label: 'Completed', value: formatNumber(counts.done), delta: `${formatNumber(counts.canceled)} canceled` },
      { label: 'Late', value: formatNumber(counts.late), delta: `Due date passed` },
      { label: 'Returned / Rejected', value: formatNumber(counts.rejected), delta: `${formatNumber(counts.new)} new awaiting fix` },
      { label: 'Canceled', value: formatNumber(counts.canceled), delta: `Total canceled` },
    ];
  }, [filteredJobs]);

  const statusData = useMemo(() => {
    const total = filteredJobs.length;
    let cursor = 0;
    const segments = statusPalette.map((status) => {
      const count = filteredJobs.filter((job) => job.status === status.key).length;
      const slice = total ? (count / total) * 360 : 0;
      const start = cursor;
      const end = cursor + slice;
      cursor = end;
      return {
        ...status,
        count,
        start,
        end,
        percentage: total ? Math.round((count / total) * 100) : 0,
      };
    });

    const gradient = segments
      .filter((segment) => segment.count > 0)
      .map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`)
      .join(', ');

    return { segments, total, gradient };
  }, [filteredJobs]);

  const departmentData = useMemo(() => {
    const counts = filteredJobs.reduce((acc, job) => {
      const dep = job.department || 'ไม่ระบุแผนก';
      acc[dep] = (acc[dep] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const max = entries[0]?.count || 0;
    return { entries, max };
  }, [filteredJobs]);

  const pendingTasks = useMemo(() => {
    const openStatuses = new Set(['new', 'in_progress', 'rejected']);
    return filteredJobs
      .filter((job) => openStatuses.has(job.status))
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDue - bDue;
      })
      .slice(0, 5);
  }, [filteredJobs]);

  const recentOrders = useMemo(
    () =>
      [...filteredJobs]
        .sort((a, b) => {
          const aOpen = a.openedAt ? new Date(a.openedAt).getTime() : 0;
          const bOpen = b.openedAt ? new Date(b.openedAt).getTime() : 0;
          return bOpen - aOpen;
        })
        .slice(0, 5),
    [filteredJobs],
  );

  return (
    <div className="dashboard-page">
      <section className="filter-bar">
        <div className="filter-group">
          <div className="filter-field">
            <span className="filter-label">แผนก</span>
            <select
              className="filter-select"
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
            >
              {filterOptions.department.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'ทั้งหมด' : opt}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <span className="filter-label">ลูกค้า</span>
            <select
              className="filter-select"
              value={filters.customer}
              onChange={(e) => setFilters((prev) => ({ ...prev, customer: e.target.value }))}
            >
              {filterOptions.customer.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'ทั้งหมด' : opt}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <span className="filter-label">Work Type</span>
            <select
              className="filter-select"
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            >
              {filterOptions.type.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'ทั้งหมด' : opt}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <span className="filter-label">สถานะ</span>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              {filterOptions.status.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all'
                    ? 'ทั้งหมด'
                    : statusPalette.find((s) => s.key === opt)?.label || opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-range">
          <button
            className={`filter-pill ${filters.range === 'week' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, range: 'week' }))}
          >
            Week
          </button>
          <button
            className={`filter-pill ${filters.range === 'month' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, range: 'month' }))}
          >
            Month
          </button>
          <button
            className={`filter-pill ${filters.range === 'year' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, range: 'year' }))}
          >
            Year
          </button>
        </div>
      </section>

      <section className="kpi-grid">
        {kpiCards.map((kpi) => (
          <article key={kpi.label} className="kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <div className="kpi-value-row">
              <p className="kpi-value">{kpi.value}</p>
              <span className="kpi-delta">{kpi.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="charts-row">
        <article className="chart-card">
          <div className="chart-header">
            <p className="chart-title">Status Split</p>
          </div>
          <div className="chart-body pie">
            <div className="pie-shell">
              <div
                className="pie-ring"
                style={{
                  background: statusData.total
                    ? `conic-gradient(${statusData.gradient})`
                    : '#f2f4f7',
                }}
              >
              </div>
            </div>
            <div className="chart-legend">
              {statusData.segments.map((segment) => (
                <div key={segment.key} className="legend-row">
                  <span className="legend-dot" style={{ background: segment.color }} />
                  <div className="legend-text">
                    <p className="legend-label">{segment.label}</p>
                    <p className="legend-meta">
                      {segment.count} งาน · {segment.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
        <article className="chart-card work-by">
          <div className="chart-header">
            <p className="chart-title">Work by Department</p>
          </div>
          <div className="chart-body bar">
            {departmentData.entries.length === 0 ? (
              <p className="chart-empty">ไม่มีข้อมูลงาน</p>
            ) : (
              <div className="bar-list">
                {departmentData.entries.map((row) => (
                  <div key={row.name} className="bar-row">
                    <p className="bar-label">{row.name}</p>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: departmentData.max
                            ? `${(row.count / departmentData.max) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <span className="bar-count">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-header">
            <p className="panel-title">
              Today’s Tasks / Action Items ({pendingTasks.length})
            </p>
          </div>
          <div className="task-list">
            {pendingTasks.length === 0 ? (
              <p className="chart-empty">ไม่มีงานค้าง</p>
            ) : (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/job/${encodeURIComponent(task.id)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/job/${encodeURIComponent(task.id)}`);
                    }
                  }}
                >
                  <div className="task-meta">
                    <p className="task-id">{task.id}</p>
                    <p className="task-customer">{task.customer || '-'}</p>
                  </div>
                  <div className="task-info">
                    <span className="badge">{task.status}</span>
                    <span className={`badge ${task.priority?.includes('สูง') ? 'danger' : ''}`}>
                      Priority: {task.priority || '-'}
                    </span>
                  </div>
                  <button
                    className="duedate"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    กำหนดส่ง: {formatShortDate(task.dueDate)}
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <p className="panel-title">Recent Work Orders</p>
          </div>
          <div className="recent-list">
            {recentOrders.length === 0 ? (
              <p className="chart-empty">ยังไม่มีข้อมูลงานล่าสุด</p>
            ) : (
              recentOrders.map((item) => (
                <div
                  key={item.id}
                  className="recent-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/job/${encodeURIComponent(item.id)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/job/${encodeURIComponent(item.id)}`);
                    }
                  }}
                >
                  <div className="recent-main">
                    <p className="task-id">{item.id}</p>
                    <p className="task-customer">{item.customer || '-'}</p>
                    <p className="recent-tech">ประเภท: {item.type || '-'}</p>
                  </div>
                  <div className="recent-meta">
                    <span className="badge neutral">Priority: {item.priority || '-'}</span>
                    <span className="badge">{item.status}</span>
                    <span className="timestamp">เปิดงาน: {formatShortDate(item.openedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
