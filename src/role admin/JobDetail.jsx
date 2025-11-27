import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useJobs } from "../context/JobsContext";
import { usePeople } from "../context/PeopleContext";
import { useAuth } from "../context/AuthContext";
import "./JobDetail.css";

const formatMapLink = (location) => {
  if (!location) return null;
  const [lat, lng] = location.split(",").map((v) => v.trim());
  if (!lat || !lng) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const formatEmbedMapUrl = (location) => {
  if (!location) return null;
  const [lat, lng] = location.split(",").map((v) => v.trim());
  if (!lat || !lng) return null;
  return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH");
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobs, updateJobStatus, updateJob } = useJobs();
  const {
    technicians: peopleTechs,
    getTechniciansByIds,
    getSupervisorById,
  } = usePeople();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const decodedId = decodeURIComponent(id);
  const job = useMemo(
    () => jobs.find((j) => j.id === decodedId),
    [jobs, decodedId]
  );
  const isTechnician = user?.role === "technician";
  const [workLog, setWorkLog] = useState({
    precheck: job?.techPrecheck || job?.workLogBefore || "",
    steps: job?.techSteps || job?.workLogAction || "",
    testResult: job?.techTestResult || job?.workLogTest || "",
    partsUsed: job?.techPartsUsed || "",
  });
  const [result, setResult] = useState({
    summary: job?.techResultSummary || job?.resultSummary || "",
    nextAction: job?.techNextAction || job?.followUpTask || "",
    status:
      job?.techResultStatus || job?.supervisorCloseStatus || job?.resultStatus || "",
  });
  const [saveMessage, setSaveMessage] = useState("");

  const handleCancelJob = () => {
    if (!job || user?.role !== "admin") return;
    const closedAt = new Date().toISOString();
    updateJob(job.id, {
      status: "canceled",
      supervisorCloseStatus: "ยกเลิก",
      supervisorCloseDate: closedAt,
    });
    updateJobStatus(job.id, "canceled");
    setCancelled(true);
    setShowCancelConfirm(false);
    setShowCancelSuccess(true);
  };

  useEffect(() => {
    if (!job) return;
    setWorkLog({
      precheck: job.techPrecheck || job.workLogBefore || "",
      steps: job.techSteps || job.workLogAction || "",
      testResult: job.techTestResult || job.workLogTest || "",
      partsUsed: job.techPartsUsed || "",
    });
    setResult({
      summary: job.techResultSummary || job.resultSummary || "",
      nextAction: job.techNextAction || job.followUpTask || "",
      status:
        job.techResultStatus || job.supervisorCloseStatus || job.resultStatus || "",
    });
  }, [job]);

  const handleSaveTechnicianSection = () => {
    if (!job || !isTechnician) return;
    if (job.status === "done" || job.status === "canceled") return;
    if (!workLog.precheck && !workLog.steps) {
      window.alert("กรุณากรอกอย่างน้อยขั้นตอนการตรวจสอบหรือการแก้ไข");
      return;
    }
    updateJob(job.id, {
      ...job,
      techPrecheck: workLog.precheck,
      workLogBefore: workLog.precheck,
      techSteps: workLog.steps,
      workLogAction: workLog.steps,
      techTestResult: workLog.testResult,
      workLogTest: workLog.testResult,
      techPartsUsed: workLog.partsUsed,
      techResultSummary: result.summary,
      resultSummary: result.summary,
      techNextAction: result.nextAction,
      followUpTask: result.nextAction,
      techResultStatus: result.status,
      resultStatus: result.status,
      techLastUpdateAt: new Date().toISOString(),
    });
    setSaveMessage("บันทึกสำเร็จ");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const resolveTechName = (value) => {
    if (!value) return "-";
    const byId = peopleTechs.find((t) => t.id === value);
    if (byId) return byId.name;
    const byName = peopleTechs.find((t) => t.name === value);
    return byName?.name || value;
  };

  const resolveSupervisorName = (value) => {
    if (!value) return "-";
    const sup = getSupervisorById(value);
    return sup?.name || value;
  };

  const technicianList = job?.technicians
    ? getTechniciansByIds(job.technicians).map((tech, idx) => ({
        ...tech,
        id: tech?.id || job.technicians[idx],
        displayName: tech?.name || job.technicians[idx],
        displayRole: tech?.role,
        displayPhone: tech?.phone,
        supervisorId: tech?.supervisorId,
        department: tech?.department,
      }))
    : [];

  const firstTech = technicianList[0];
  const departmentFromTech = firstTech?.department;
  const primaryTechRole = firstTech?.displayRole || firstTech?.role;

  if (!job) {
    return (
      <div className="job-detail-page">
        <p>ไม่พบใบงาน</p>
        <button className="btn-primary" onClick={() => navigate(-1)}>
          ย้อนกลับ
        </button>
      </div>
    );
  }

  const isEmbedHtml = Boolean(job.mapUrl && job.mapUrl.includes('<iframe'));
  const embedMapUrl = !isEmbedHtml ? job.mapUrl || formatEmbedMapUrl(job.location) : '';
  const mapLink = !isEmbedHtml ? job.mapUrl || formatMapLink(job.location) : '';
  const iframeSrc = isEmbedHtml ? job.mapUrl.match(/src=["']([^"']+)/i)?.[1] : '';
  const mapHref = iframeSrc || mapLink || formatMapLink(job.location);
  const displayStatus = cancelled ? "canceled" : job.status || "-";
  const displayCloseStatus = cancelled ? "ยกเลิก" : job.supervisorCloseStatus || "-";
  const isClosed = job.status === "done" || job.status === "canceled";

  return (
    <div className="job-detail-page">
      <button
        className="job-detail-back"
        type="button"
        onClick={() => navigate(-1)}
      >
        Back
      </button>

      <div className="job-detail-hero">
        <div>
          <p className="job-detail-eyebrow">Work Order</p>
          <h1 className="job-detail-main-title">{job.title}</h1>
          {/* <p className="job-detail-subtext">{job.desc}</p> */}
        </div>
        {/* <div className="job-detail-tags"> */}
        {/* <span className="pill">ID: {job.id}</span>
          <span className="pill neutral">Version: {job.version || '-'}</span>
          <span className="pill neutral">Status: {job.status}</span>
          <span className="pill">{job.type}</span>
          {job.badge && <span className="pill accent">{job.badge}</span>}
          <span className="pill">Priority: {job.priority || '-'}</span>
          <span className="pill">Due: {formatDateTime(job.dueDate)}</span> */}
        {/* </div> */}
      </div>

      <div className="job-detail-grid">
        <section className="job-detail-card">
          <div className="job-detail-section">
            <div className="job-detail-section-header">
              <p className="job-detail-title">ส่วนที่1:ข้อมูลใบงาน</p>
              {user?.role === "admin" && (
                <button
                  className="btn-cancel"
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelled}
                >
                  Cancel Job
                </button>
              )}
            </div>
            <div className="field-grid two-col">
              <div className="field">
                <p className="field-label">เลขที่ใบงาน</p>
                <p className="field-value">{job.id}</p>
              </div>
              <div className="field">
                <p className="field-label">เวอร์ชัน</p>
                <p className="field-value">{job.version || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">วันที่เปิดใบงาน</p>
                <p className="field-value">{formatDateTime(job.openedAt)}</p>
              </div>
              <div className="field">
                <p className="field-label">ประเภทงาน</p>
                <p className="field-value">{job.type || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">ความเร่งด่วน</p>
                <p className="field-value">{job.priority || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">กำหนดแล้วเสร็จ</p>
                <p className="field-value">{formatDateTime(job.dueDate)}</p>
              </div>
              <div className="field full">
                <p className="field-label">แผนก</p>
                <p className="field-value">{primaryTechRole || departmentFromTech || job.department || "-"}</p>
              </div>
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">Location</p>
            <div className="job-detail-map-box">
              {isEmbedHtml ? (
                <div
                  className="job-detail-iframe"
                  dangerouslySetInnerHTML={{ __html: job.mapUrl }}
                />
              ) : embedMapUrl ? (
                <iframe
                  title="Map location"
                  src={embedMapUrl}
                  className="job-detail-iframe"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="map-placeholder">
                  <p>ไม่มีข้อมูลพิกัด</p>
                </div>
              )}

              <p className="value" style={{ marginTop: 8 }}>
                {job.locationAddress || "No address"}
              </p>
            </div>

            <div className="job-detail-map-actions">
              <button
                className="checkin-btn"
                disabled={!mapHref}
                onClick={() => mapHref && window.open(mapHref, "_blank")}
              >
                Get Location
              </button>
            </div>
            {cancelled && (
              <p className="cancelled-status">สถานะ: ปิดงานเรียบร้อย</p>
            )}
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">
              ส่วนที่2:ข้อมูลลูกค้า / สถานที่ปฏิบัติงาน
            </p>
            <div className="field-grid two-col">
              <div className="field">
                <p className="field-label">ชื่อลูกค้า / บริษัท</p>
                <p className="field-value">{job.customer || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">ผู้ติดต่อหน้างาน</p>
                <p className="field-value">{job.contactPerson || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">เบอร์โทรศัพท์</p>
                <p className="field-value">{job.contactPhone || "-"}</p>
              </div>
              <div className="field full">
                <p className="field-label">ที่อยู่หน้างาน</p>
                <p className="field-value">{job.address || "-"}</p>
              </div>
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">ส่วนที่3: รายละเอียดคำร้อง</p>
            <div className="field">
              <p className="field-label">ชื่องาน</p>
              <p className="field-value">{job.title || "-"}</p>
            </div>
            <div className="field">
              <p className="field-label">รายละเอียดคำร้อง</p>
              <p className="field-value">{job.requirementDetail || "-"}</p>
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">ส่วนที่4:ข้อมูลช่างผู้ดำเนินการ</p>
            <div className="field-grid two-col">
              <div className="field">
                <p className="field-label">ช่าง</p>
                <p className="field-value">
                  {resolveTechName(job.mainTechnician)}
                </p>
                {technicianList[0]?.displayRole && (
                  <p className="tech-role">{technicianList[0]?.displayRole}</p>
                )}
                {technicianList[0]?.displayPhone && (
                  <p className="tech-phone">
                    {technicianList[0]?.displayPhone}
                  </p>
                )}
              </div>
              <div className="field">
                <p className="field-label">เวลาเช็คอินหน้างาน</p>
                <p className="field-value">{formatDateTime(job.checkInAt)}</p>
              </div>
              <div className="field">
                <p className="field-label">เวลาเช็คเอาต์หน้างาน</p>
                <p className="field-value">{formatDateTime(job.checkOutAt)}</p>
              </div>
              {technicianList.length > 0 && (
                <div className="field full">
                  <p className="field-label">รายชื่อช่างที่ร่วมงาน</p>
                  <div className="tech-list-grid">
                    {technicianList.map((tech) => (
                      <div key={tech.id || tech.name} className="tech-card">
                        <p className="field-value">{tech.displayName || "-"}</p>
                        {tech.displayRole && (
                          <p className="tech-role">{tech.displayRole}</p>
                        )}
                        {tech.displayPhone && (
                          <p className="tech-phone">{tech.displayPhone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">
              ส่วนที่5:บันทึกการดำเนินงานของช่าง
            </p>
            {isClosed && (
              <p className="field-value closed-note">
                ใบงานปิดแล้ว ไม่สามารถแก้ไขบันทึกได้
              </p>
            )}
            <div className="field">
              <p className="field-label">
                ขั้นตอนการตรวจสอบ / สภาพก่อนดำเนินการ
              </p>
              {isTechnician ? (
                <textarea
                  className="field-input"
                  value={workLog.precheck}
                  onChange={(e) =>
                    setWorkLog((prev) => ({ ...prev, precheck: e.target.value }))
                  }
                  rows={3}
                  disabled={isClosed}
                />
              ) : (
                <p className="field-value">
                  {job.techPrecheck || job.workLogBefore || "-"}
                </p>
              )}
            </div>
            <div className="field">
              <p className="field-label">
                ขั้นตอนการแก้ไข / ปรับปรุง / ติดตั้ง
              </p>
              {isTechnician ? (
                <textarea
                  className="field-input"
                  value={workLog.steps}
                  onChange={(e) =>
                    setWorkLog((prev) => ({ ...prev, steps: e.target.value }))
                  }
                  rows={3}
                  disabled={isClosed}
                />
              ) : (
                <p className="field-value">
                  {job.techSteps || job.workLogAction || "-"}
                </p>
              )}
            </div>
            <div className="field">
              <p className="field-label">การทดสอบหลังดำเนินการ</p>
              {isTechnician ? (
                <textarea
                  className="field-input"
                  value={workLog.testResult}
                  onChange={(e) =>
                    setWorkLog((prev) => ({ ...prev, testResult: e.target.value }))
                  }
                  rows={3}
                  disabled={isClosed}
                />
              ) : (
                <p className="field-value">
                  {job.techTestResult || job.workLogTest || "-"}
                </p>
              )}
            </div>
            <div className="field">
              <p className="field-label">อุปกรณ์ / อะไหล่ที่ใช้</p>
              {isTechnician ? (
                <textarea
                  className="field-input"
                  value={workLog.partsUsed}
                  onChange={(e) =>
                    setWorkLog((prev) => ({ ...prev, partsUsed: e.target.value }))
                  }
                  rows={2}
                  disabled={isClosed}
                />
              ) : (
                <p className="field-value">
                  {job.techPartsUsed || job.partsUsed || "-"}
                </p>
              )}
            </div>
            <div className="worklog-photo">
              <p className="field-label">ภาพประกอบหน้างาน</p>
              {job.workLogPhotos && job.workLogPhotos.length > 0 ? (
                <div className="worklog-gallery">
                  {job.workLogPhotos.map((src, idx) => (
                    <div key={src} className="worklog-photo-box">
                      <img
                        src={src}
                        alt={`Work log ${idx + 1}`}
                        className="worklog-img"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="worklog-photo-box">
                  <p className="field-value">ไม่มีรูปภาพ</p>
                </div>
              )}
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title"> ส่วนที่6:ผลการดำเนินงาน</p>
            <div className="field-grid two-col">
              <div className="field">
                <p className="field-label">สถานะงาน</p>
                {isTechnician ? (
                  <select
                    className="field-input"
                    value={result.status}
                    onChange={(e) =>
                      setResult((prev) => ({ ...prev, status: e.target.value }))
                    }
                    disabled={isClosed}
                  >
                    <option value="">-- เลือกสถานะ --</option>
                    <option value="สำเร็จ">สำเร็จ</option>
                    <option value="สำเร็จบางส่วน">สำเร็จบางส่วน</option>
                    <option value="ไม่สำเร็จ">ไม่สำเร็จ</option>
                  </select>
                ) : (
                  <p className="field-value">
                    {job.techResultStatus || job.resultStatus || "-"}
                  </p>
                )}
              </div>
              <div className="field full">
                <p className="field-label">สรุปผลการดำเนินงาน</p>
                {isTechnician ? (
                  <textarea
                    className="field-input"
                    value={result.summary}
                    onChange={(e) =>
                      setResult((prev) => ({ ...prev, summary: e.target.value }))
                    }
                    rows={3}
                    disabled={isClosed}
                  />
                ) : (
                  <p className="field-value">
                    {job.techResultSummary || job.resultSummary || "-"}
                  </p>
                )}
              </div>
              <div className="field full">
                <p className="field-label">งานที่ต้องติดตามต่อ</p>
                {isTechnician ? (
                  <textarea
                    className="field-input"
                    value={result.nextAction}
                    onChange={(e) =>
                      setResult((prev) => ({ ...prev, nextAction: e.target.value }))
                    }
                    rows={2}
                    disabled={isClosed}
                  />
                ) : (
                  <p className="field-value">
                    {job.techNextAction || job.followUpTask || "-"}
                  </p>
                )}
              </div>
            </div>
          </div>
          {isTechnician && (
            <div className="job-detail-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveTechnicianSection}
                disabled={isClosed}
              >
                บันทึกบันทึกการดำเนินงาน
              </button>
              {saveMessage && <p className="save-message">{saveMessage}</p>}
            </div>
          )}

          <div className="job-detail-section">
            <p className="job-detail-title">
              ส่วนที่7:ความเห็นเพิ่มเติม / หมายเหตุ
            </p>
            <div className="field">
              <p className="field-label">หมายเหตุของช่าง</p>
              <p className="field-value">{job.technicianNote || "-"}</p>
            </div>
            <div className="field">
              <p className="field-label">หมายเหตุของหัวหน้างาน</p>
              <p className="field-value">{job.supervisorNote || "-"}</p>
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">ส่วนที่8:การอนุมัติ / การปิดงาน</p>
            <div className="field-grid two-col">
              <div className="field">
                <p className="field-label">ชื่อลูกค้าที่ตรวจรับ</p>
                <p className="field-value">{job.customerSignName || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">ตำแหน่ง</p>
                <p className="field-value">{job.customerSignTitle || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">วันที่ลูกค้าตรวจรับ</p>
                <p className="field-value">{job.customerSignDate || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">ลายเซ็นลูกค้า</p>
                <p className="field-value">
                  {job.customerSignName ? "Signed" : "-"}
                </p>
              </div>
              <div className="field">
                <p className="field-label">หัวหน้าช่าง</p>
                <p className="field-value">
                  {resolveSupervisorName(job.supervisorCloseName)}
                </p>
              </div>
              <div className="field">
                <p className="field-label">วันที่ปิดงาน</p>
                <p className="field-value">{job.supervisorCloseDate || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">สถานะปิดงาน</p>
                <p className="field-value">{displayCloseStatus}</p>
              </div>
              <div className="field">
                <p className="field-label">สถานะใบงานปัจจุบัน</p>
                <p className="field-value">{displayStatus}</p>
              </div>
              <div className="field full">
                <p className="field-label">เหตุผลหากตีกลับ</p>
                <p className="field-value">
                  {job.supervisorCloseReason || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>
    </div>
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-title">ยืนยันการยกเลิกใบงาน</p>
            <p className="modal-text">คุณต้องการยกเลิกใบงานนี้หรือไม่?</p>
            <div className="modal-actions">
              <button className="btn-secondary" type="button" onClick={() => setShowCancelConfirm(false)}>
                ยกเลิก
              </button>
              <button className="btn-cancel" type="button" onClick={handleCancelJob}>
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelSuccess && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-title">ปิดงานเรียบร้อย</p>
            <p className="modal-text">ใบงานนี้ถูกยกเลิกแล้ว</p>
            <div className="modal-actions">
              <button className="btn-primary" type="button" onClick={() => setShowCancelSuccess(false)}>
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
