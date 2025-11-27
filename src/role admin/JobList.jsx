import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JobList.css';
import { useJobs } from '../context/JobsContext';
import { usePeople } from '../context/PeopleContext';
import { useNavigate } from 'react-router-dom';

const columns = [
  { key: 'new', title: 'New Jobs', color: '#4785FC', hover: '#4785FC' },
  { key: 'in_progress', title: 'On Progress', color: '#ac7cf8', hover: '#ac7cf8' },
  { key: 'pending', title: 'Pending', color: '#f97316', hover: '#f97316' },
  { key: 'rejected', title: 'Reject', color: '#fec667', hover: '#fec667' },
  { key: 'done', title: 'Done', color: '#019b5f', hover: '#019b5f' },
  { key: 'canceled', title: 'Canceled', color: '#fe5b48', hover: '#fe5b48' },
  { key: 'draft', title: 'Draft', color: '#94a3b8', hover: '#94a3b8' },
];

export default function JobList() {
  const { jobs } = useJobs();
  const { technicians: peopleTechs, getTechniciansByIds } = usePeople();
  const navigate = useNavigate();
  const [hoveredJob, setHoveredJob] = useState(null);
  const hoverTimer = useRef(null);
  const [search, setSearch] = useState('');
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortFields, setSortFields] = useState({ date: true, workId: false, type: false });
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    type: 'all',
    supervisor: '',
    technician: '',
  });
  const columnsRef = useRef(null);
  const [page, setPage] = useState(0);

  const technicianOptions = useMemo(
    () => peopleTechs.map((t) => t.name).filter(Boolean),
    [peopleTechs],
  );

  const filteredJobs = useMemo(() => {
    const matchDateRange = (job) => {
      if (!filters.from && !filters.to) return true;
      const opened = job.openedAt ? new Date(job.openedAt) : null;
      if (!opened || Number.isNaN(opened.getTime())) return false;
      if (filters.from && opened < new Date(filters.from)) return false;
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        if (opened > toDate) return false;
      }
      return true;
    };

    const matchSearch = (job) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        job.id.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        (job.customer || '').toLowerCase().includes(q) ||
        (job.desc || '').toLowerCase().includes(q) ||
        (job.address || '').toLowerCase().includes(q)
      );
    };

    const matchType = (job) => filters.type === 'all' || job.type === filters.type;
    const matchSupervisor = (job) =>
      !filters.supervisor ||
      (job.supervisorCloseName || '').toLowerCase().includes(filters.supervisor.toLowerCase());
    const matchTechnician = (job) => {
      if (!filters.technician) return true;
      const techs = getTechniciansByIds(job.technicians || []);
      const q = filters.technician.toLowerCase();
      return techs.some((t) => (t?.name || '').toLowerCase().includes(q));
    };

    const sortFns = [];
    if (sortFields.date) {
      sortFns.push((a, b) => new Date(b.openedAt || 0) - new Date(a.openedAt || 0));
    }
    if (sortFields.workId) {
      sortFns.push((a, b) => a.id.localeCompare(b.id));
    }
    if (sortFields.type) {
      sortFns.push((a, b) => (a.type || '').localeCompare(b.type || ''));
    }

    const result = jobs.filter(
      (job) =>
        matchDateRange(job) &&
        matchSearch(job) &&
        matchType(job) &&
        matchSupervisor(job) &&
        matchTechnician(job),
    );

    if (sortFns.length) {
      result.sort((a, b) => {
        for (const fn of sortFns) {
          const diff = fn(a, b);
          if (diff !== 0) return diff;
        }
        return 0;
      });
    }

    return result;
  }, [filters, getTechniciansByIds, jobs, search, sortFields]);

  const handleHoverStart = (job, color) => {
    hoverTimer.current = setTimeout(() => {
      setHoveredJob({ ...job, color });
    }, 500);
  };

  const handleHoverEnd = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
    hoverTimer.current = null;
    setHoveredJob(null);
  };

  const pageSize = 4;
  const maxPage = Math.max(Math.ceil(columns.length / pageSize) - 1, 0);
  const visibleColumns = columns.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    setPage((prev) => Math.min(prev, maxPage));
  }, [maxPage]);

  return (
    <>
      <div className="joblist-toolbar">
        <div className="search-box">
          <input
            className="search-input"
            placeholder="Search by ID, title, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <div className="dropdown sort">
            <button className="dropdown-toggle" onClick={() => setShowSort((v) => !v)}>
              Sort
              <span className={`chevron ${showSort ? 'up' : 'down'}`} />
            </button>
            {showSort && (
              <div className="dropdown-card">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={sortFields.date}
                    onChange={(e) => setSortFields((prev) => ({ ...prev, date: e.target.checked }))}
                  />
                  <span>Date</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={sortFields.workId}
                    onChange={(e) => setSortFields((prev) => ({ ...prev, workId: e.target.checked }))}
                  />
                  <span>Work ID</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={sortFields.type}
                    onChange={(e) => setSortFields((prev) => ({ ...prev, type: e.target.checked }))}
                  />
                  <span>Type</span>
                </label>
              </div>
            )}
          </div>

          <div className="dropdown filter">
            <button className="dropdown-toggle" onClick={() => setShowFilter((v) => !v)}>
              Filter
              <span className="filter-icon">⏷</span>
            </button>
            {showFilter && (
              <div className="dropdown-card filter-card">
                <div className="filter-header">
                  <p>Filter</p>
                  <button
                    className="link-reset"
                    onClick={() =>
                      setFilters({ from: '', to: '', type: 'all', supervisor: '', technician: '' })
                    }
                  >
                   
                  </button>
                </div>
                <div className="filter-field">
                  <div className="filter-label-row">
                    <span>Date Range</span>
                    <button
                      className="link-reset"
                      onClick={() => setFilters((prev) => ({ ...prev, from: '', to: '' }))}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="filter-row two">
                    <div className="input-group">
                      <label>From :</label>
                      <input
                        type="date"
                        value={filters.from}
                        onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                      />
                    </div>
                    <div className="input-group">
                      <label>To :</label>
                      <input
                        type="date"
                        value={filters.to}
                        onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="filter-field">
                  <div className="filter-label-row">
                    <span>Work Type</span>
                    <button
                      className="link-reset"
                      onClick={() => setFilters((prev) => ({ ...prev, type: 'all' }))}
                    >
                      Reset
                    </button>
                  </div>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="all">All types</option>
                    <option value="MA">Maintenance Agreement (MA)</option>
                    <option value="Per-call">Per-call</option>
                    <option value="Project">Project</option>
                  </select>
                </div>

                <div className="filter-field">
                  <div className="filter-label-row">
                    <span>Supervisor</span>
                    <button
                      className="link-reset"
                      onClick={() => setFilters((prev) => ({ ...prev, supervisor: '' }))}
                    >
                      Reset
                    </button>
                  </div>
                  <input
                    type="text"
                    value={filters.supervisor}
                    placeholder="Name"
                    onChange={(e) => setFilters((prev) => ({ ...prev, supervisor: e.target.value }))}
                  />
                </div>

                <div className="filter-field">
                  <div className="filter-label-row">
                    <span>Technician</span>
                    <button
                      className="link-reset"
                      onClick={() => setFilters((prev) => ({ ...prev, technician: '' }))}
                    >
                      Reset
                    </button>
                  </div>
                  <input
                    list="tech-options"
                    type="text"
                    value={filters.technician}
                    placeholder="Name"
                    onChange={(e) => setFilters((prev) => ({ ...prev, technician: e.target.value }))}
                  />
                  <datalist id="tech-options">
                    {technicianOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div className="filter-actions">
                  <button
                    className="btn-reset"
                    onClick={() =>
                      setFilters({ from: '', to: '', type: 'all', supervisor: '', technician: '' })
                    }
                  >
                    Reset
                  </button>
                  <button className="btn-apply" onClick={() => setShowFilter(false)}>
                    Apply Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <section className="joblist-board">
        <div className="board-header">
          <div>
            <p className="board-eyebrow">Overview</p>
            <h1 className="board-title">Joblist</h1>
          </div>
          <button className="add-job-btn" type="button" onClick={() => navigate('/admin/create-job')}>
            + Add new job
          </button>
        </div>
        <div className="job-columns-wrap">
          <button
            type="button"
            className="page-button left"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            ‹
          </button>
          <button
            type="button"
            className="page-button right"
            disabled={page === maxPage}
            onClick={() => setPage((p) => Math.min(p + 1, maxPage))}
          >
            ›
          </button>
          <div className="job-columns" ref={columnsRef}>
            {visibleColumns.map((column) => {
              const jobsByStatus = filteredJobs.filter((job) => job.status === column.key);
              return (
                <div
                  className="job-column"
                  key={column.key}
                  style={{ borderColor: column.color, background: `${column.color}1A` }}
                >
                  <div className="job-column-head">
                    <div>
                      <p className="job-column-label">{column.title}</p>
                      <p className="job-column-count">{jobsByStatus.length} positions</p>
                    </div>
                    <div className="job-column-dot" style={{ background: column.color }} />
                  </div>
                  <div className="job-column-cards">
                    {jobsByStatus.map((job) => (
                      <article
                        className="job-card"
                        key={job.id}
                        style={{ '--card-hover': column.hover, '--card-border': column.color }}
                        onMouseEnter={() => handleHoverStart(job, column.color)}
                        onMouseLeave={handleHoverEnd}
                      >
                        {/* <div className="job-card-dot" /> */}
                        <div className="job-card-body">
                          <p className="job-card-title">{job.id}</p>
                          <p className="job-card-title">{job.title}</p>
                          <p className="job-card-desc">{job.desc}</p>
                          <div className="job-card-meta">
                            <span className="job-card-badge">{job.badge}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="job-card-link"
                          onClick={() => navigate(`/admin/job/${encodeURIComponent(job.id)}`)}
                        >
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {hoveredJob && (
          <div className="job-hover-detail" style={{ borderColor: hoveredJob.color }}>
            <div className="job-hover-header">Detail</div>
            <div className="job-hover-body">
              <p className="job-hover-title">{hoveredJob.title}</p>
              <p className="job-hover-desc">
                {hoveredJob.desc || 'Body text for whatever you’d like to say. Add main takeaway points, quotes, anecdotes, or even a very short story.'}
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
