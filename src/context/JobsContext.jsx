import { createContext, useContext, useMemo, useState, useEffect } from 'react';


const JobsContext = createContext(null);


const initialJobs = [
  {
    id: 'WO-25-01-0001',
    title: 'เปลี่ยนคอมเพรสเซอร์แอร์ห้องประชุม',
    desc: 'สำนักงานใหญ่ - On-site',
    badge: 'Urgent',
    status: 'new',
    customer: 'บริษัท A',
    type: 'MA',
    department: 'IT Support',
    version: 'v1',
    priority: 'ต่ำ (Low)',
    openedAt: '2025-11-20T',
    dueDate: '2025-11-29T',
    location: '13.855642274086346, 100.58548532919454',
    locationAddress: 'ชั้น 12 อาคาร11 มหาวิทยาลัยศรีปทุม',
    mapUrl: 'https://maps.google.com/?q=13.855642274086346,100.58548532919454',
    contactPerson: 'คุณเอ',
    contactPhone: '0800000001',
    address: '99/1 ถนนแจ้งวัฒนะ กรุงเทพฯ',
    requirementDetail: 'ตรวจสอบและเปลี่ยนคอมเพรสเซอร์แอร์ห้องประชุม',
    mainTechnician: 'tech-01',
    supervisorId: 'sup-01',
    technicians: ['tech-01', 'tech-02'],
    checkInAt: '',
    checkOutAt: '',
    workLogBefore: 'แอร์ไม่เย็น มีเสียงดัง',
    workLogAction: '',
    workLogTest: '',
    workLogPhotos: [
    ],
    resultStatus: '',
    resultSummary: '',
    followUpTask: '',
    technicianNote: '',
    supervisorNote: '',
    customerSignName: '',
    customerSignTitle: '',
    customerSignDate: '',
    supervisorCloseName: '',
    supervisorCloseDate: '',
    supervisorCloseStatus: '',
    supervisorCloseReason: '',
  },
  {
    id: 'WO-25-02-0002',
    title: 'ตรวจเช็คระบบไฟฟ้าชั้น 12',
    desc: 'สำนักงานใหญ่ - On-site',
    badge: 'Follow-up',
    status: 'in_progress',
    customer: 'บริษัท B',
    type: 'Per-call',
    department: 'Facility',
    version: 'v1',
    priority: 'กลาง (Normal)',
    openedAt: '2025-11-21T10:00:00',
    dueDate: '2025-11-26T10:00:00',
    location: '13.7584, 100.5040',
    locationAddress: 'แถวอนุสาวรีย์ชัยฯ - On-site',
    mapUrl: 'https://maps.google.com/?q=13.7584,100.5040',
    contactPerson: 'คุณบี',
    contactPhone: '0800000002',
    address: 'ชั้น 12 อาคารสำนักงานใหญ่',
    requirementDetail: 'ตรวจเช็คระบบไฟฟ้าและเบรกเกอร์',
    mainTechnician: 'tech-03',
    supervisorId: 'sup-02',
    technicians: ['tech-03'],
    checkInAt: '2025-11-25T09:00:00',
    checkOutAt: '',
    workLogBefore: 'ไฟตกเป็นระยะ',
    workLogAction: 'วัดโหลด เปลี่ยนเบรกเกอร์',
    workLogTest: 'ทดสอบโหลดปกติ',
    workLogPhotos: [
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80',
    ],
    resultStatus: 'สำเร็จบางส่วน',
    resultSummary: 'แก้ไขแล้ว เหลือติดตั้ง Surge Protector',
    followUpTask: 'ติดตั้ง Surge Protector สัปดาห์หน้า',
    technicianNote: '',
    supervisorNote: '',
    customerSignName: '',
    customerSignTitle: '',
    customerSignDate: '',
    supervisorCloseName: '',
    supervisorCloseDate: '',
    supervisorCloseStatus: '',
    supervisorCloseReason: '',
  },

  {
    id: 'WO-25-02-0006',
    title: 'ตรวจเช็คระบบไฟฟ้าชั้น 13',
    desc: 'สำนักงานใหญ่ - On-site',
    badge: 'Follow-up',
    status: 'in_progress',
    customer: 'บริษัท c',
    type: 'Per-call',
    department: 'Facility',
    version: 'v1',
    priority: 'กลาง (Normal)',
    openedAt: '2025-11-22T11:00:00',
    dueDate: '2025-11-26T10:00:00',
    location: '13.7584, 100.5040',
    locationAddress: 'ชั้น 12 อาคาร11 มหาวิทยาลัยศรีปทุม',
    mapUrl: 'https://maps.google.com/?q=13.7584,100.5040',
    contactPerson: 'คุณซี',
    contactPhone: '0800000003',
    address: 'ชั้น 13 อาคารสำนักงานใหญ่',
    requirementDetail: 'ตรวจเช็คระบบไฟฟ้าชั้น 13',
    mainTechnician: 'tech-03',
    supervisorId: 'sup-02',
    technicians: ['tech-03'],
    checkInAt: '',
    checkOutAt: '',
    workLogBefore: '',
    workLogAction: '',
    workLogTest: '',
    workLogPhotos: [],
    resultStatus: 'สำเร็จบางส่วน',
    resultSummary: '',
    followUpTask: '',
    technicianNote: '',
    supervisorNote: '',
  },

  {
    id: 'WO-25-03-0003',
    title: 'ทดสอบระบบกล้องวงจรปิด',
    desc: 'สาขาบางนา - Remote',
    badge: 'Review',
    status: 'done',
    customer: 'บริษัท C',
    type: 'Project',
    department: 'Security',
    version: 'v1',
    priority: 'ต่ำ (Low)',
    openedAt: '2025-11-15T08:00:00',
    dueDate: '2025-11-20T09:00:00',
    location: '13.6691, 100.6342',
    locationAddress: 'สาขาบางนา - Remote',
    mapUrl: 'https://maps.google.com/?q=13.6691,100.6342',
    contactPerson: 'คุณดี',
    contactPhone: '0800000004',
    address: 'สาขาบางนา',
    requirementDetail: 'ทดสอบระบบกล้องและบันทึก',
    mainTechnician: 'tech-02',
    supervisorId: 'sup-01',
    technicians: ['tech-02'],
    checkInAt: '2025-11-19T10:00:00',
    checkOutAt: '2025-11-19T15:00:00',
    workLogBefore: 'กล้องบางตัวภาพไม่ขึ้น',
    workLogAction: 'รีเซ็ต ตั้งค่าใหม่ อัปเดตเฟิร์มแวร์',
    workLogTest: 'ภาพขึ้นครบ ระบบบันทึกปกติ',
    workLogPhotos: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    ],
    resultStatus: 'สำเร็จสมบูรณ์',
    resultSummary: 'กล้องใช้งานได้ครบทุกตัว',
    followUpTask: 'ตรวจเช็คซ้ำ 1 เดือน',
    technicianNote: '',
    supervisorNote: '',
    customerSignName: 'คุณอารี',
    customerSignTitle: 'ผู้จัดการสาขา',
    customerSignDate: '2025-11-19',
    supervisorCloseName: 'หัวหน้าช่างบอย',
    supervisorCloseDate: '2025-11-19',
    supervisorCloseStatus: 'อนุมัติ',
    supervisorCloseReason: '',
  },
  {
    id: 'WO-25-01-0004',
    title: 'อัปเดตซอฟต์แวร์เครื่องแม่ข่าย',
    desc: 'ดาต้าเซ็นเตอร์ - Remote',
    badge: 'Delayed',
    status: 'rejected',
    customer: 'บริษัท D',
    type: 'MA',
    department: 'IT Ops',
    version: 'v1',
    priority: 'สูง (Critical)',
    openedAt: '2025-11-18T11:00:00',
    dueDate: '2025-11-28T18:00:00',
    location: '13.78, 100.55',
    locationAddress: 'ดาต้าเซ็นเตอร์',
    mapUrl: 'https://maps.google.com/?q=13.78,100.55',
    contactPerson: 'คุณอี',
    contactPhone: '0800000005',
    address: 'ดาต้าเซ็นเตอร์',
    requirementDetail: 'อัปเดต OS และแพตช์ความปลอดภัย',
    mainTechnician: 'tech-04',
    supervisorId: 'sup-02',
    technicians: ['tech-04'],
    checkInAt: '',
    checkOutAt: '',
    workLogBefore: 'ต้องการอัปเดตแพตช์',
    workLogAction: 'ยกเลิกโดยลูกค้า',
    workLogTest: '',
    workLogPhotos: [],
    resultStatus: 'ไม่สำเร็จ',
    resultSummary: 'ลูกค้ายกเลิก',
    followUpTask: 'รอคิวใหม่',
    technicianNote: '',
    supervisorNote: '',
    customerSignName: '',
    customerSignTitle: '',
    customerSignDate: '',
    supervisorCloseName: '',
    supervisorCloseDate: '',
    supervisorCloseStatus: 'ตีกลับให้แก้ไข',
    supervisorCloseReason: 'ลูกค้ายกเลิกกะทันหัน',
  },
  {
    id: 'WO-25-02-0005',
    title: 'ยกเลิกงานตรวจสอบสายสื่อสาร',
    desc: 'สำนักงานใหญ่ - On-site',
    badge: 'Canceled',
    status: 'canceled',
    customer: 'บริษัท E',
    type: 'Per-call',
    department: 'Network',
    version: 'v1',
    priority: 'ต่ำ (Low)',
    openedAt: '2025-11-10T08:00:00',
    dueDate: '2025-11-30T09:00:00',
    location: '13.745, 100.532',
    locationAddress: 'สำนักงานใหญ่ - On-site',
    mapUrl: 'https://maps.google.com/?q=13.745,100.532',
    contactPerson: 'คุณเอฟ',
    contactPhone: '0800000006',
    address: 'สำนักงานใหญ่ ถนนพระราม 6',
    requirementDetail: 'ตรวจสอบสายสื่อสาร (ยกเลิก)',
    mainTechnician: '',
    supervisorId: '',
    technicians: [],
    checkInAt: '',
    checkOutAt: '',
    workLogBefore: '',
    workLogAction: '',
    workLogTest: '',
    workLogPhotos: [],
    resultStatus: 'ไม่สำเร็จ',
    resultSummary: 'งานถูกยกเลิก',
    followUpTask: '',
    technicianNote: '',
    supervisorNote: '',
    customerSignName: '',
    customerSignTitle: '',
    customerSignDate: '',
    supervisorCloseName: '',
    supervisorCloseDate: '',
    supervisorCloseStatus: 'ตีกลับให้แก้ไข',
    supervisorCloseReason: 'ยกเลิกงาน',
  },
];

const STORAGE_KEY = 'jobs-data-v1';

const normalizeDates = (job) => {
  if (!job) return job;
  const dateFields = [
    'openedAt',
    'dueDate',
    'checkInAt',
    'checkOutAt',
    'customerSignDate',
    'supervisorCloseDate',
  ];
  const next = { ...job };
  dateFields.forEach((field) => {
    const value = next[field];
    if (typeof value === 'string' && value.includes('T')) {
      next[field] = value.split('T')[0];
    }
  });
  return next;
};

export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const byId = new Map();
        initialJobs.forEach((job) => byId.set(job.id, normalizeDates(job)));
        parsed.forEach((job) => {
          if (job && job.id) byId.set(job.id, job);
        });
        return Array.from(byId.values()).map(normalizeDates);
      }
    } catch (e) {
      console.error('Failed to parse jobs from localStorage', e);
    }
    return initialJobs.map(normalizeDates);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.error('Failed to save jobs to localStorage', e);
    }
  }, [jobs]);

  const updateJobStatus = (id, newStatus) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, status: newStatus } : job)),
    );
  };

  const assignTechnicians = (id, technicians) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, technicians } : job,
      ),
    );
  };

  const updateJob = (id, patch) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? normalizeDates({ ...job, ...patch }) : job)),
    );
  };

  const addJob = (newJob) => {
    setJobs((prev) => [...prev, normalizeDates(newJob)]);
  };

  const removeJob = (id) => {
    if (!id) return;
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const value = useMemo(
    () => ({ jobs, updateJobStatus, assignTechnicians, addJob, updateJob, removeJob }),
    [jobs],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) {
    throw new Error('useJobs must be used within JobsProvider');
  }
  return ctx;
}
