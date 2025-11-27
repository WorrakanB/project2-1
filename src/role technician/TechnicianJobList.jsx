import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { getJobsForTechnician, loadJobs, mergeJobsById, saveJobs } from '../utils/jobStorage';
import './TechnicianJobList.css';

const columns = [
  { key: 'new', title: 'New Jobs', color: '#019B5F', hover: '#019B5F' },
  { key: 'in_progress', title: 'On Progress', color: '#ac7cf8', hover: '#ac7cf8' },
  { key: 'pending', title: 'Pending', color: '#f97316', hover: '#f97316' },
  { key: 'rejected', title: 'Reject', color: '#fec667', hover: '#fec667' },
  { key: 'done', title: 'Done', color: '#019b5f', hover: '#019b5f' },
  { key: 'canceled', title: 'Canceled', color: '#fe5b48', hover: '#fe5b48' },
];

const statusOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'กำลังทำ' },
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'rejected', label: 'ถูกตีกลับ' },
  { value: 'returned', label: 'ต้องแก้ไข' },
  { value: 'done', label: 'เสร็จแล้ว' },
  { value: 'canceled', label: 'ยกเลิก' },
];

const typeOptions = [
  { value: 'all', label: 'ทุกประเภท' },
  { value: 'MA', label: 'Maintenance Agreement (MA)' },
  { value: 'Per-call', label: 'Per-call' },
  { value: 'Per Call', label: 'Per Call' },
  { value: 'Project', label: 'Project' },
];

const priorityOptions = [
  { value: 'all', label: 'ทุกความเร่งด่วน' },
  { value: 'สูง', label: 'สูง' },
  { value: 'กลาง', label: 'กลาง' },
  { value: 'ต่ำ', label: 'ต่ำ' },
];

const rangeOptions = [
  { value: 'week', label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'all', label: 'ทั้งหมด' },
];

export default function TechnicianJobList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobs: ctxJobs } = useJobs();

  const [jobs, setJobs] = useState([]);
  const [hoveredJob, setHoveredJob] = useState(null);
  const hoverTimer = useRef(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    range: 'all',
  });
  const [page, setPage] = useState(0);

  const pageSize = 4;

  // แสดงเฉพาะใบงานของช่างพีระ (tech-03)
  const techCandidates = useMemo(
    () => new Set(['tech-03', 'พีระ'].map((t) => String(t).toLowerCase())),
    [],
  );

  // โหลดงานของช่างจาก localStorage + context
  useEffect(() => {
    if (!user) {
      setJobs([]);
      return;
    }
    const merged = mergeJobsById(ctxJobs, loadJobs());
    if (merged.length) {
      saveJobs(merged);
    }
    const myJobs = getJobsForTechnician(Array.from(techCandidates), merged);
    setJobs(myJobs);
  }, [ctxJobs, techCandidates, user]);

  const filteredJobs = useMemo(() => {
    const now = new Date();
    const rangeStart = (() => {
      if (filters.range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (filters.range === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return null;
    })();

    return jobs
      .filter((job) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          job.id?.toLowerCase().includes(q) ||
          (job.title || '').toLowerCase().includes(q) ||
          (job.customer || '').toLowerCase().includes(q) ||
          (job.address || '').toLowerCase().includes(q) ||
          (job.requirementDetail || '').toLowerCase().includes(q)
        );
      })
      .filter((job) => {
        if (filters.status === 'all') return true;
        const status = (job.status || '').toLowerCase();
        return status === filters.status || status === filters.status.replace('_', '');
      })
      .filter((job) => {
        if (filters.type === 'all') return true;
        return (job.type || '').toLowerCase().includes(filters.type.toLowerCase());
      })
      .filter((job) => {
        if (filters.priority === 'all') return true;
        const value = (job.priority || '').toLowerCase();
        if (filters.priority === 'สูง') return value.includes('สูง') || value.includes('high');
        if (filters.priority === 'กลาง') return value.includes('กลาง') || value.includes('medium');
        if (filters.priority === 'ต่ำ') return value.includes('ต่ำ') || value.includes('low');
        return true;
      })
      .filter((job) => {
        if (!rangeStart) return true;
        const openedAt = job.openedAt ? new Date(job.openedAt) : null;
        const due = job.dueDate ? new Date(job.dueDate) : null;
        const inRange =
          (openedAt && openedAt >= rangeStart) ||
          (due && due >= rangeStart);
        return inRange;
      });
  }, [filters, jobs, search]);

  const maxPage = Math.max(Math.ceil(columns.length / pageSize) - 1, 0);
  const visibleColumns = columns.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    setPage((prev) => Math.min(prev, maxPage));
  }, [maxPage]);

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

  return (
    <div className="joblist-page tech-skin">
      <div className="joblist-toolbar">
        <div className="search-box">
          <input
            className="search-input"
            placeholder="Search by ID, title, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-actions" />
      </div>

      <section className="joblist-board">
        <div className="board-header">
          <div>
            <p className="board-eyebrow">Overview</p>
            <h1 className="board-title">Joblist (Technician)</h1>
          </div>
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
          <div className="job-columns">
            {visibleColumns.map((column) => {
              const jobsByStatus = filteredJobs.filter((job) => {
                if (column.key === 'rejected') {
                  return job.status === 'rejected' || job.status === 'returned';
                }
                if (column.key === 'pending') {
                  return job.status === 'pending' || job.status === 'pending_review';
                }
                return job.status === column.key;
              });
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
                        <div className="job-card-body">
                          <p className="job-card-title">{job.id}</p>
                          <p className="job-card-title">{job.title}</p>
                          <p className="job-card-desc">{job.desc || job.customer || job.requirementDetail}</p>
                          <div className="job-card-meta">
                            <span className="job-card-badge">{job.badge || job.type}</span>
                            <span className="job-card-meta-text">
                              Due: {job.dueDate ? new Date(job.dueDate).toLocaleDateString('th-TH') : '-'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="job-card-link"
                          onClick={() => navigate(`/technician/job/${encodeURIComponent(job.id)}`)}
                        >
                        </button>
                      </article>
                    ))}
                    {jobsByStatus.length === 0 && <p className="tech-empty">ไม่มีงานในคอลัมน์นี้</p>}
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
                {hoveredJob.desc ||
                  hoveredJob.requirementDetail ||
                  'รายละเอียดใบงาน'}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
