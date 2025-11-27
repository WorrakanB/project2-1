// ยูทิลิตี้เก็บ/ดึงข้อมูลใบงานจาก localStorage ใช้ร่วมกันทุก role
// ใช้ key เดียวกับ JobsContext เดิมเพื่อความต่อเนื่อง
const STORAGE_KEY = 'jobs-data-v1';

export const loadJobs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('loadJobs failed', err);
    return [];
  }
};

export const saveJobs = (jobs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs || []));
  } catch (err) {
    console.error('saveJobs failed', err);
  }
};

export const addJob = (job) => {
  const jobs = loadJobs();
  jobs.push(job);
  saveJobs(jobs);
};

export const updateJob = (updatedJob) => {
  if (!updatedJob || !updatedJob.id) return;
  const jobs = loadJobs();
  const next = jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j));
  saveJobs(next);
};
