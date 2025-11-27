import { useEffect, useMemo, useState } from 'react';
import '../role technician/TechnicianDashboard.css';
import './CreateJobPage.css';
import './JobDetail.css';
import { useJobs } from '../context/JobsContext';
import { usePeople } from '../context/PeopleContext';

const defaultForm = {
  jobId: '',
  mainTechnician: '',
  assistantTechnician: '',
  extraTechnicians: [],
  supervisor: '',
  department: '',
  priority: 'MEDIUM',
  startDate: '',
  dueDate: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  location: '',
  requirement: '',
  attachmentsNote: '',
  status: 'Draft',
};

export default function AdminCreateJobPage({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(defaultForm);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const { jobs, addJob, removeJob } = useJobs();
  const { supervisors, technicians } = usePeople();
  const [deleteJobId, setDeleteJobId] = useState('WO-25-01-0007.shsojvp');

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultForm, ...initialData });
    }
  }, [initialData]);

  const currentYear = new Date().getFullYear().toString().slice(-2);
  const jobTypeCode = '01';
  const jobCount = jobs?.length ?? 0;
  const generatedJobId = useMemo(() => {
    const nextRunningNumber = jobCount + 1;
    const runningPart = String(nextRunningNumber).padStart(4, '0');
    return `WO-${currentYear}-${jobTypeCode}-${runningPart}`;
  }, [currentYear, jobCount, jobTypeCode]);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      jobId: generatedJobId,
    }));
  }, [generatedJobId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const requiredFields = useMemo(
    () => ['mainTechnician', 'supervisor', 'priority', 'startDate', 'dueDate', 'customerName', 'contactPhone'],
    []
  );

  const isPhoneValid = (phone) => {
    if (!phone) return false;
    return /^\d{9,10}$/.test(phone.trim());
  };

  const isDueDateValid = (start, due) => {
    if (!start || !due) return true;
    return new Date(due) >= new Date(start);
  };

  const resolveLocationParts = (value) => {
    if (!value) return { latLng: '', mapUrl: '' };

    // If user pastes full iframe embed, keep it as-is
    if (value.includes('<iframe')) {
      return { latLng: '', mapUrl: value };
    }

    const decoded = decodeURIComponent(value.trim());

    // 1) มี lat,lng ชัดเจน
    const patterns = [
      /@(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/, // ...@lat,lng,...
      /[?&]q=(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/, // ...q=lat,lng...
      /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/, // plain "lat,lng"
    ];

    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (match) {
        const [, lat, lng] = match;
        const latLng = `${lat},${lng}`;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
        return { latLng, mapUrl };
      }
    }

    // 2) เป็นลิงก์ Google Maps แต่ไม่มี lat,lng ตรง ๆ
    const isGoogleMapsUrl =
      decoded.includes('google.com/maps') ||
      decoded.includes('maps.google.com') ||
      decoded.includes('goo.gl/maps') ||
      decoded.includes('maps.app.goo.gl');

    if (isGoogleMapsUrl) {
      const mapUrl =
        'https://www.google.com/maps?q=' + encodeURIComponent(decoded) + '&output=embed';
      return { latLng: '', mapUrl };
    }

    // 3) อย่างอื่น ใช้เป็นคำค้นหา
    const fallbackMapUrl =
      'https://www.google.com/maps?q=' + encodeURIComponent(decoded) + '&output=embed';

    return { latLng: '', mapUrl: fallbackMapUrl };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const priorityLabels = {
    HIGH: 'สูง (Critical)',
    MEDIUM: 'กลาง (Normal)',
    LOW: 'ต่ำ (Low)',
  };

  const supervisorOptions = useMemo(() => {
    if (!form.department) {
      return supervisors.map((sup) => ({ value: sup.id, label: sup.name || sup.id }));
    }
    const supHasDept = new Set(
      technicians
        .map((tech) => ({ ...tech, dept: tech.department || tech.role }))
        .filter((tech) => tech.dept === form.department)
        .map((tech) => tech.supervisorId)
        .filter(Boolean),
    );
    return supervisors
      .filter((sup) => supHasDept.has(sup.id))
      .map((sup) => ({ value: sup.id, label: sup.name || sup.id }));
  }, [form.department, supervisors, technicians]);

  const departmentOptions = useMemo(
    () => ['IT Support', 'Facility', 'Security', 'Network', 'IT Ops', 'อื่นๆ'],
    [],
  );

  const matchesDepartment = (tech) =>
    !form.department || !tech.department || tech.department === form.department;

  const baseTechnicianOptions = useMemo(() => {
    const list = technicians
      .map((tech) => ({
        value: tech.id,
        label: tech.name || tech.id,
        display: tech.role ? `${tech.name || tech.id} (${tech.role})` : tech.name || tech.id,
        supervisorId: tech.supervisorId,
        role: tech.role,
        department: tech.department || tech.role,
      }))
      .filter((tech) => !form.supervisor || tech.supervisorId === form.supervisor);
    const sorted = [...list].sort(
      (a, b) => (a.role || '').localeCompare(b.role || '') || (a.label || '').localeCompare(b.label || ''),
    );
    return { sorted, unsorted: list };
  }, [form.supervisor, technicians]);

  const allTechnicianOptions = useMemo(
    () =>
      technicians.map((tech) => ({
        value: tech.id,
        label: tech.name || tech.id,
        display: tech.role ? `${tech.name || tech.id} (${tech.role})` : tech.name || tech.id,
        supervisorId: tech.supervisorId,
        role: tech.role,
        department: tech.department || tech.role,
      })),
    [technicians],
  );

  const mainTechOptions = useMemo(
    () => baseTechnicianOptions.sorted.filter((tech) => matchesDepartment(tech)),
    [baseTechnicianOptions, form.department],
  );

  const assistantTechOptions = mainTechOptions;
  const extraTechOptions = useMemo(() => allTechnicianOptions, [allTechnicianOptions]);

  const selectedTechIds = useMemo(
    () =>
      new Set(
        [form.mainTechnician, form.assistantTechnician, ...(form.extraTechnicians || [])].filter(
          Boolean,
        ),
      ),
    [form.assistantTechnician, form.extraTechnicians, form.mainTechnician],
  );

  const getAvailableTechOptions = (options, currentValue) =>
    options.filter((opt) => opt.value === currentValue || !selectedTechIds.has(opt.value));

  useEffect(() => {
    const validMainTechIds = new Set(baseTechnicianOptions.unsorted.map((opt) => opt.value));
    const validExtraTechIds = new Set(allTechnicianOptions.map((opt) => opt.value));
    setForm((prev) => ({
      ...prev,
      mainTechnician: validMainTechIds.has(prev.mainTechnician) ? prev.mainTechnician : '',
      assistantTechnician: validMainTechIds.has(prev.assistantTechnician)
        ? prev.assistantTechnician
        : '',
      extraTechnicians: (prev.extraTechnicians || []).filter((id) => validExtraTechIds.has(id)),
    }));
  }, [allTechnicianOptions, baseTechnicianOptions.unsorted]);

  const handleExtraTechChange = (index, value) => {
    setForm((prev) => {
      const next = [...(prev.extraTechnicians || [])];
      next[index] = value;
      return { ...prev, extraTechnicians: next };
    });
    setIsDirty(true);
  };

  const addExtraTechnician = () => {
    setForm((prev) => ({ ...prev, extraTechnicians: [...(prev.extraTechnicians || []), ''] }));
    setIsDirty(true);
  };

  const removeExtraTechnician = (index) => {
    setForm((prev) => {
      const next = [...(prev.extraTechnicians || [])];
      next.splice(index, 1);
      return { ...prev, extraTechnicians: next };
    });
    setIsDirty(true);
  };

  const buildJobPayload = (statusKey) => {
    const technicians = [
      form.mainTechnician,
      form.assistantTechnician,
      ...(form.extraTechnicians || []),
    ].filter(Boolean);
    const badge =
      form.priority === 'HIGH' ? 'Urgent' : form.priority === 'LOW' ? 'Low' : 'Normal';
    const { latLng, mapUrl } = resolveLocationParts(form.location);

    return {
      id: form.jobId,
      title: form.requirement?.trim() || `งาน MA สำหรับลูกค้า ${form.customerName || '-'}`,
      desc: form.address || '',
      badge,
      status: statusKey,
      customer: form.customerName,
      type: 'MA',
      department: form.department || '',
      version: 'v1',
      priority: priorityLabels[form.priority] || form.priority,
      openedAt: form.startDate || new Date().toISOString(),
      dueDate: form.dueDate || '',
      location: latLng || form.location || '',
      locationAddress: form.address || '',
      mapUrl: mapUrl || '',
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      address: form.address,
      requirementDetail: form.requirement,
      mainTechnician: form.mainTechnician,
      supervisorId: form.supervisor,
      technicians,
      checkInAt: '',
      checkOutAt: '',
      workLogBefore: '',
      workLogAction: '',
      workLogTest: '',
      workLogPhotos: [],
      resultStatus: '',
      resultSummary: '',
      followUpTask: '',
      technicianNote: '',
      supervisorNote: '',
      customerSignName: '',
      customerSignTitle: '',
      customerSignDate: '',
      supervisorCloseName: form.supervisor,
      supervisorCloseDate: '',
      supervisorCloseStatus: '',
      supervisorCloseReason: '',
    };
  };

  const validate = () => {
    const nextErrors = {};
    requiredFields.forEach((field) => {
      if (!form[field]) nextErrors[field] = 'จำเป็น';
    });
    if (!isPhoneValid(form.contactPhone)) {
      nextErrors.contactPhone = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง';
    }
    if (!isDueDateValid(form.startDate, form.dueDate)) {
      nextErrors.dueDate = 'กำหนดส่งต้องเป็นวันเดียวกันหรือหลังวันเริ่มต้น';
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      alert(nextErrors.contactPhone || 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
      return;
    }
    const newJob = buildJobPayload('new');
    addJob(newJob);
    setForm((prev) => ({ ...prev, status: 'new' }));
    onSubmit?.(newJob);
    setToast('บันทึกใบงานเรียบร้อยแล้ว');
  };

  const handleSaveDraft = () => {
    const phoneErrors = {};
    if (form.contactPhone && !isPhoneValid(form.contactPhone)) {
      phoneErrors.contactPhone = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง';
      setErrors((prev) => ({ ...prev, ...phoneErrors }));
      alert(phoneErrors.contactPhone);
      return;
    }
    if (form.startDate && form.dueDate && !isDueDateValid(form.startDate, form.dueDate)) {
      const dateError = { dueDate: 'กำหนดส่งต้องเป็นวันเดียวกันหรือหลังวันเริ่มต้น' };
      setErrors((prev) => ({ ...prev, ...dateError }));
      alert(dateError.dueDate);
      return;
    }
    const draftJob = buildJobPayload('draft');
    addJob(draftJob);
    setForm((prev) => ({ ...prev, status: 'draft' }));
    onSubmit?.(draftJob);
    setToast('บันทึกใบงานเรียบร้อยแล้ว');
  };

  const handleDeleteJob = () => {
    const targetId = deleteJobId.trim();
    if (!targetId) {
      alert('กรุณากรอกเลขใบงานที่ต้องการลบ');
      return;
    }
    removeJob(targetId);
    setToast(`ลบใบงาน ${targetId} แล้ว`);
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmExit = window.confirm(
        'คุณยังไม่ได้บันทึกการเปลี่ยนแปลง ต้องการออกจากหน้านี้หรือไม่?'
      );
      if (!confirmExit) return;
    }
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <>
    <button className="job-detail-back" type="button" onClick={() => window.history.back()}>
        <i className="bi bi-chevron-compact-left" aria-hidden="true" />
        <span>Back</span>
      </button>
    <div className="tech-dashboard-page tech-form-page createjob-page">
      
      <header className="tech-form-header createjob-header">
        <div>
          <h3>Maintenance Agreement (MA)</h3>
          {/* <p className="tech-subtext">สร้างใบงานซ่อมบำรุงสำหรับส่งให้ช่าง</p> */}
        </div>
      </header>

      <form className="tech-form-grid" onSubmit={handleSubmit}>
        <div className="tech-form-row">
          <label className="tech-form-label createjob-label wide">
            เลขที่ใบงาน (WO)
            <input
              id="jobId"
              name="jobId"
              type="text"
              value={form.jobId}
              readOnly
              className="tech-input createjob-input readonly"
            />
          </label>
        </div>
        <section className="tech-two-column createjob-two-column">
          <section className="tech-panel tech-form-section createjob-panel">
            <p className="tech-panel-title section-title">ส่วนที่ 1 : ข้อมูลใบงาน</p>
            <div className="tech-form-row">
              <div className="tech-form-row">
              <label className="tech-form-label createjob-label">
                แผนก
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="tech-input createjob-select"
                >
                  <option value="">-- เลือก --</option>
                  {departmentOptions.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </label>
            </div>
               <label className="tech-form-label createjob-label">
                หัวหน้างาน
                <select name="supervisor" value={form.supervisor} onChange={handleChange} className="tech-input createjob-select">
                  <option value="">-- เลือก --</option>
                  {supervisorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.supervisor && <span className="tech-error">{errors.supervisor}</span>}
              </label>
              <label className="tech-form-label createjob-label">
                เลือกช่าง
                <select
                  name="mainTechnician"
                  value={form.mainTechnician}
                  onChange={handleChange}
                  className="tech-input createjob-select"
                >
                  <option value="">-- เลือก --</option>
                  {getAvailableTechOptions(mainTechOptions, form.mainTechnician).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display || opt.label}
                    </option>
                  ))}
                </select>
                {errors.mainTechnician && <span className="tech-error">{errors.mainTechnician}</span>}
              </label>
            </div>
            <div className="tech-form-row">
              <label className="tech-form-label createjob-label wide">
                {(form.extraTechnicians || []).map((techId, idx) => (
                  <div key={idx} className="extra-tech-row">
                    <select
                      value={techId}
                      onChange={(e) => handleExtraTechChange(idx, e.target.value)}
                      className="tech-input createjob-select extra-tech-select"
                >
                  <option value="">-- เลือก --</option>
                  {getAvailableTechOptions(extraTechOptions, techId).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display || opt.label}
                    </option>
                  ))}
                </select>
                    
                    <div className="extra-tech-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => removeExtraTechnician(idx)}
                      >
                        ลบ
                      </button>
                      <button
                        type="button"
                        className="btn-secondary extra-tech-add"
                        onClick={addExtraTechnician}
                      >
                        + เพิ่มช่างร่วมงาน
                      </button>
                    </div>
                  </div>
                ))}
                {(form.extraTechnicians || []).length === 0 && (
                  <button type="button" className="btn-secondary extra-tech-add" onClick={addExtraTechnician}>
                    + เพิ่มช่างร่วมงาน
                  </button>
                )}
              </label>
            </div>

            

            <div className="tech-form-row">
              <div className="tech-priority-block createjob-field">
                <p className="tech-form-label createjob-label">ความเร่งด่วน (Priority)</p>
                <div className="tech-priority-options vertical">
                  {[
                    { value: 'HIGH', label: 'สูง (Critical)', color: 'danger' },
                    { value: 'MEDIUM', label: 'กลาง (Normal)', color: 'info' },
                    { value: 'LOW', label: 'ต่ำ (Low)', color: 'success' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`tech-priority-chip vertical ${opt.color} ${form.priority === opt.value ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={opt.value}
                        checked={form.priority === opt.value}
                        onChange={handleChange}
                      />
                      <span className="priority-check">{form.priority === opt.value ? '✓' : ''}</span>
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.priority && <span className="tech-error">{errors.priority}</span>}
              </div>
            </div>

            <div className="tech-form-row">
              <label className="tech-form-label createjob-label">
                Start Date
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  min={todayISO}
                  onChange={handleChange}
                  className="tech-input createjob-input"
                />
                {errors.startDate && <span className="tech-error">{errors.startDate}</span>}
              </label>
              <label className="tech-form-label createjob-label">
                Due Date / SLA
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  min={form.startDate || todayISO}
                  onChange={handleChange}
                  className="tech-input createjob-input"
                />
                {errors.dueDate && <span className="tech-error">{errors.dueDate}</span>}
              </label>
            </div>

            
          </section>

          <section className="tech-panel tech-form-section createjob-panel">
            <p className="tech-panel-title section-title">ส่วนที่ 2 : ข้อมูลลูกค้า / สถานที่ปฏิบัติงาน</p>
            <div className="tech-form-row">
              <label className="tech-form-label createjob-label">
                ชื่อลูกค้า / บริษัท
                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  className="tech-input createjob-input"
                />
                {errors.customerName && <span className="tech-error">{errors.customerName}</span>}
              </label>
              <label className="tech-form-label createjob-label">
                ผู้ติดต่อหน้างาน
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  className="tech-input createjob-input"
                />
              </label>
              <label className="tech-form-label createjob-label">
                เบอร์โทรศัพท์
                <input
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  className="tech-input createjob-input"
                />
                {errors.contactPhone && <span className="tech-error">{errors.contactPhone}</span>}
              </label>
              <label className="tech-form-label createjob-label wide">
                ที่อยู่หน้างาน
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="tech-textarea createjob-textarea"
                  rows={2}
                />
              </label>
            </div>

            <div className="tech-form-row">
              <label className="tech-form-label createjob-label wide">
                Location (ลิงก์แผนที่ หรือ iframe embed)
                <textarea
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="tech-textarea createjob-textarea"
                  rows={3}
                  placeholder="วางลิงก์แผนที่ หรือโค้ด iframe"
                />
              </label>
              <label className="tech-form-label createjob-label wide">
                Requirement
                <br />
                <textarea
                  name="requirement"
                  value={form.requirement}
                  onChange={handleChange}
                  className="tech-textarea createjob-textarea"
                  rows={3}
                />
              </label>
              <label className="tech-form-label createjob-label wide">
                Upload Document
                <div className="tech-upload-box createjob-upload-box">
                  <div className="upload-icon">⬆</div>
                  <p className="tech-subtext">Drag and drop document to upload your support work</p>
                  <div className="tech-upload-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, attachmentsNote: 'เลือกไฟล์แล้ว' }));
                        setIsDirty(true);
                      }}
                    >
                      Browse files
                    </button>
                    {form.attachmentsNote && <span className="tech-subtext">{form.attachmentsNote}</span>}
                  </div>
                </div>
              </label>
            </div>
          </section>
        </section>

        <div className="tech-form-row">
          <label className="tech-form-label createjob-label wide">
            ลบใบงานด้วยรหัส (สำหรับผู้ดูแล)
            <div
              style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}
            >
              <input
                type="text"
                value={deleteJobId}
                onChange={(e) => setDeleteJobId(e.target.value)}
                className="tech-input createjob-input"
                placeholder="เช่น WO-25-01-0007.shsojvp"
                style={{ flex: '1 1 240px' }}
              />
              <button type="button" className="btn-cancel" onClick={handleDeleteJob}>
                ลบใบงานนี้
              </button>
            </div>
            <span className="tech-subtext">ใช้เพื่อลบข้อมูลใบงานที่บันทึกไว้ในเครื่อง (localStorage)</span>
          </label>
        </div>

        <div className="tech-form-footer createjob-footer">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn-secondary" onClick={handleSaveDraft}>
            บันทึกเป็นฉบับร่าง
          </button>
          <button type="submit" className="btn-primary">
            บันทึกและส่งให้ช่าง
          </button>
        </div>
      </form>
      {toast && (
        <div className="tech-toast">
          <span>{toast}</span>
        </div>
      )}
    </div>
    </>
  );
}



