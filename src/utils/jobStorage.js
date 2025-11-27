// Shared jobs storage helper (single source of truth for every role)
// Use this file instead of touching localStorage directly.
export const JOBS_STORAGE_KEY = 'jobs-data-v1';

const normalizeJob = (job) => {
  if (!job) return job;
  const next = { ...job };
  const dateFields = [
    'openedAt',
    'dueDate',
    'startDate',
    'checkInAt',
    'checkOutAt',
    'customerSignDate',
    'supervisorCloseDate',
  ];
  dateFields.forEach((field) => {
    const value = next[field];
    if (typeof value === 'string' && value.includes('T')) {
      next[field] = value.split('T')[0];
    }
  });
  return next;
};

export const loadJobs = (fallback = []) => {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return Array.isArray(fallback) ? fallback : [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array.isArray(fallback) ? fallback : [];
    return parsed.map(normalizeJob);
  } catch (err) {
    console.error('loadJobs failed', err);
    return Array.isArray(fallback) ? fallback : [];
  }
};

export const saveJobs = (jobs) => {
  try {
    const normalized = (jobs || []).map(normalizeJob);
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('saveJobs failed', err);
  }
};

export const upsertJob = (job) => {
  if (!job || !job.id) return [];
  const jobs = loadJobs();
  const exists = jobs.some((j) => j.id === job.id);
  const next = exists ? jobs.map((j) => (j.id === job.id ? normalizeJob(job) : j)) : [...jobs, normalizeJob(job)];
  saveJobs(next);
  return next;
};

export const deleteJob = (jobId) => {
  if (!jobId) return [];
  const jobs = loadJobs();
  const next = jobs.filter((j) => j.id !== jobId);
  saveJobs(next);
  return next;
};

export const findJobById = (jobId, source) => {
  if (!jobId) return undefined;
  const jobs = Array.isArray(source) ? source : loadJobs();
  return jobs.find((j) => j?.id === jobId);
};

const buildCandidateSet = (technicianIds) => {
  const list = Array.isArray(technicianIds) ? technicianIds : [technicianIds];
  return new Set(
    list
      .filter(Boolean)
      .map((id) => String(id).toLowerCase()),
  );
};

export const getJobsForTechnician = (technicianIds, source) => {
  const candidates = buildCandidateSet(technicianIds);
  if (!candidates.size) return [];
  const jobs = Array.isArray(source) ? source : loadJobs();
  return jobs.filter((job) => {
    const main = String(job?.mainTechnicianId || job?.mainTechnician || '').toLowerCase();
    const assistants = [
      ...(job?.assistantTechnicianIds || []),
      ...(job?.technicians || []),
    ].map((t) => String(t).toLowerCase());
    if (candidates.has(main)) return true;
    return assistants.some((id) => candidates.has(id));
  });
};

export const mergeJobsById = (primary = [], secondary = []) => {
  const byId = new Map();
  (primary || []).forEach((job) => {
    if (job?.id) byId.set(job.id, normalizeJob(job));
  });
  (secondary || []).forEach((job) => {
    if (job?.id) byId.set(job.id, normalizeJob(job));
  });
  return Array.from(byId.values());
};
