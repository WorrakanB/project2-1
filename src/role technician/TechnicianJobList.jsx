import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { loadJobs, saveJobs } from '../utils/jobStorage';
import './TechnicianJobList.css';

const rangeOptions = [
  { key: 'week', label: 'สัปดาห์นี้' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'all', label: 'ทั้งหมด' },
];

const statusColumns = [
  { key: 'today', title: 'งานวันนี้' },
  { key: 'in_progress', title: 'กำลังดำเนินการ' },
  { key: 'returned', title: 'ถูกตีกลับ/ต้องแก้' },
  { key: 'late', title: 'ล่าช้า' },
  { key: 'done', title: 'งานเสร็จแล้ว' },
];

const priorityTone = (priority) => {
  if (!priority) return 'neutral';
  if (priority.includes('สูง')) return 'high';
  if (priority.includes('กลาง')) return 'medium';
  return 'low';
};

export default function TechnicianJobList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobs: ctxJobs } = useJobs();

  const [search, setSearch] = useState('');
  const [range, setRange] = useState('week');

  // รวมข้อมูลจาก storage และ context (admin เพิ่งสร้างใหม่จะอยู่ใน ctx)
  const mergedJobs = useMemo(() => {
    const stored = loadJobs();
    const byId = new Map();
    stored.forEach((j) => byId.set(j.id, j));
    ctxJobs.forEach((j) => byId.set(j.id, j));
    return Array.from(byId.values());
  }, [ctxJobs]);

  // sync context -> storage เพื่อให้ techniciain เห็นงานล่าสุดจาก admin
  useEffect(() => {
    if (ctxJobs && ctxJobs.length) {
      saveJobs(ctxJobs);
    }
  }, [ctxJobs]);
  // รวม candidate id ของช่าง (บาง env ใช้ username, บาง env ใช้รหัส tech-01)
  const techCandidates = useMemo(() => {
    const base = [user?.id, user?.username, user?.name].filter(Boolean);
    // เผื่อชื่อ user เป็น "tech" ให้ลองจับคู่กับ tech-01..tech-04
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

  const filteredByOwner = useMemo(() => mergedJobs.filter((job) => isMine(job)), [mergedJobs, techCandidates]);

  const filteredBySearch = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return filteredByOwner;
    return filteredByOwner.filter((job) => {
      const haystack = [
        job.id,
        job.title,
        job.customer,
        job.address,
        job.requirementDetail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [filteredByOwner, search]);

  const filteredJobs = useMemo(() => {
    const now = new Date();
    const rangeStart = (() => {
      if (range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (range === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return null;
    })();

    return filteredBySearch.filter((job) => {
      if (!rangeStart) return true;
      const openedAt = job.openedAt ? new Date(job.openedAt) : null;
      const due = job.dueDate ? new Date(job.dueDate) : null;
      const inRange =
        (openedAt && openedAt >= rangeStart) ||
        (due && due >= rangeStart);
      return inRange;
    });
  }, [filteredBySearch, range]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const columnJobs = useMemo(() => {
    const cols = {
      today: [],
      in_progress: [],
      returned: [],
      late: [],
      done: [],
    };

    filteredJobs.forEach((job) => {
      const dueDate = job.dueDate ? new Date(job.dueDate) : null;
      const dueKey = dueDate ? dueDate.toISOString().slice(0, 10) : '';
      const isClosed = job.status === 'done' || job.status === 'canceled';
      const isLate =
        dueDate && dueDate.getTime() < Date.now() && !isClosed;

      if (!isClosed && dueKey === todayKey) {
        cols.today.push(job);
      }

      if (job.status === 'in_progress') {
        cols.in_progress.push(job);
      }

      if (job.status === 'rejected' || job.status === 'returned') {
        cols.returned.push(job);
      }

      if (isLate) {
        cols.late.push(job);
      }

      if (job.status === 'done') {
        cols.done.push(job);
      }
    });

    return cols;
  }, [filteredJobs, todayKey]);

  const renderCard = (job) => {
    const dueText = job.dueDate
      ? new Date(job.dueDate).toLocaleDateString('th-TH')
      : '-';
    return (
      <div
        key={job.id}
        className="tech-job-card"
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/technician/job/${encodeURIComponent(job.id)}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/technician/job/${encodeURIComponent(job.id)}`);
          }
        }}
      >
        <div className="tech-job-id">{job.id}</div>
        <p className="tech-job-customer">{job.customer || '-'}</p>
        <p className="tech-job-title">{job.title || job.requirementDetail || '-'}</p>
        <div className="tech-job-badges">
          <span className={`tech-priority ${priorityTone(job.priority)}`}>
            {job.priority || 'ไม่ระบุ'}
          </span>
          <span className="tech-pill neutral">กำหนดส่ง: {dueText}</span>
          <span className="tech-pill">{job.status || '-'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="tech-joblist-page">
      <header className="tech-joblist-header">
        <div>
          <p className="eyebrow">Technician</p>
          <h1>งานของฉัน</h1>
        </div>
      </header>

      <section className="tech-filter-bar">
        <input
          type="text"
          className="tech-search"
          placeholder="ค้นหาใบงาน (ID / ชื่องาน / ลูกค้า / ที่อยู่)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="tech-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {rangeOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <section className="tech-board">
        {statusColumns.map((col) => (
          <div key={col.key} className="tech-column">
            <div className="tech-column-header">
              <p className="tech-column-title">
                {col.title} ({columnJobs[col.key]?.length || 0})
              </p>
            </div>
            <div className="tech-column-body">
              {columnJobs[col.key]?.length ? (
                columnJobs[col.key].map(renderCard)
              ) : (
                <p className="tech-empty">ไม่มีงานในคอลัมน์นี้</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
