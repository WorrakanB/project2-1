import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useJobs } from "../context/JobsContext";
import { useAuth } from "../context/AuthContext";
import "../role admin/JobDetail.css";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH");
};

export default function TechnicianJobDetail() {
  const { id } = useParams();
  const { jobs, updateJob } = useJobs();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== "technician") {
    return <Navigate to="/login" replace />;
  }

  const decodedId = decodeURIComponent(id);
  const job = useMemo(
    () => jobs.find((j) => j.id === decodedId),
    [jobs, decodedId]
  );

  const [workLog, setWorkLog] = useState({
    beforeWorkNote: job?.technicianBeforeWorkNote || job?.workLogBefore || "",
    workSteps: job?.technicianWorkSteps || job?.workLogAction || "",
    testResult: job?.technicianTestResult || job?.workLogTest || "",
    partsUsed: job?.technicianPartsUsed || job?.techPartsUsed || "",
  });

  const [result, setResult] = useState({
    status:
      job?.technicianResultStatus ||
      job?.techResultStatus ||
      job?.resultStatus ||
      "",
    summary:
      job?.technicianSummary || job?.techResultSummary || job?.resultSummary || "",
    nextAction:
      job?.technicianNextAction || job?.techNextAction || job?.followUpTask || "",
  });

  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!job) return;
    setWorkLog({
      beforeWorkNote: job.technicianBeforeWorkNote || job.workLogBefore || "",
      workSteps: job.technicianWorkSteps || job.workLogAction || "",
      testResult: job.technicianTestResult || job.workLogTest || "",
      partsUsed: job.technicianPartsUsed || job.techPartsUsed || "",
    });
    setResult({
      status:
        job.technicianResultStatus ||
        job.techResultStatus ||
        job.resultStatus ||
        "",
      summary:
        job.technicianSummary ||
        job.techResultSummary ||
        job.resultSummary ||
        "",
      nextAction:
        job.technicianNextAction ||
        job.techNextAction ||
        job.followUpTask ||
        "",
    });
  }, [job]);

  if (!job) {
    return (
      <div className="job-detail-page">
        <p>ไม่พบใบงาน</p>
        <button className="btn-primary" type="button" onClick={() => navigate(-1)}>
          ย้อนกลับ
        </button>
      </div>
    );
  }

  const handleSave = () => {
    updateJob(job.id, {
      technicianBeforeWorkNote: workLog.beforeWorkNote,
      technicianWorkSteps: workLog.workSteps,
      technicianTestResult: workLog.testResult,
      technicianPartsUsed: workLog.partsUsed,
      technicianResultStatus: result.status,
      technicianSummary: result.summary,
      technicianNextAction: result.nextAction,
    });
    setSaveMessage("บันทึกสำเร็จ");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  return (
    <div className="job-detail-page">
      <button className="job-detail-back" type="button" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="job-detail-hero">
        <div>
          <p className="job-detail-eyebrow">Work Order</p>
          <h1 className="job-detail-main-title">{job.title}</h1>
        </div>
      </div>

      <div className="job-detail-grid">
        <section className="job-detail-card">
          <div className="job-detail-section">
            <div className="job-detail-section-header">
              <p className="job-detail-title">ส่วนที่1:ข้อมูลใบงาน</p>
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
                <p className="field-value">{formatDate(job.openedAt)}</p>
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
                <p className="field-value">{formatDate(job.dueDate)}</p>
              </div>
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">ส่วนที่2:ข้อมูลลูกค้า / สถานที่ปฏิบัติงาน</p>
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
                <p className="field-label">ช่างหลัก</p>
                <p className="field-value">{job.mainTechnician || "-"}</p>
              </div>
              <div className="field">
                <p className="field-label">เวลาเช็คอินหน้างาน</p>
                <p className="field-value">{formatDate(job.checkInAt)}</p>
              </div>
              <div className="field">
                <p className="field-label">เวลาเช็คเอาต์หน้างาน</p>
                <p className="field-value">{formatDate(job.checkOutAt)}</p>
              </div>
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">ส่วนที่5:บันทึกการดำเนินงานของช่าง</p>
            <div className="field">
              <p className="field-label">ขั้นตอนการตรวจสอบ / สภาพก่อนดำเนินการ</p>
              <textarea
                className="field-input"
                value={workLog.beforeWorkNote}
                onChange={(e) =>
                  setWorkLog((prev) => ({ ...prev, beforeWorkNote: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="field">
              <p className="field-label">ขั้นตอนการแก้ไข / ปฏิบัติงาน</p>
              <textarea
                className="field-input"
                value={workLog.workSteps}
                onChange={(e) =>
                  setWorkLog((prev) => ({ ...prev, workSteps: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="field">
              <p className="field-label">การทดสอบหลังดำเนินการ</p>
              <textarea
                className="field-input"
                value={workLog.testResult}
                onChange={(e) =>
                  setWorkLog((prev) => ({ ...prev, testResult: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="field">
              <p className="field-label">อะไหล่ / อุปกรณ์ที่ใช้</p>
              <textarea
                className="field-input"
                value={workLog.partsUsed}
                onChange={(e) =>
                  setWorkLog((prev) => ({ ...prev, partsUsed: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>

          <div className="job-detail-section">
            <p className="job-detail-title">ส่วนที่6:ผลการดำเนินงาน</p>
            <div className="field-grid two-col">
              <div className="field">
                <p className="field-label">สถานะงาน</p>
                <select
                  className="field-input"
                  value={result.status}
                  onChange={(e) =>
                    setResult((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="">-- เลือกสถานะ --</option>
                  <option value="สำเร็จ">สำเร็จ</option>
                  <option value="สำเร็จบางส่วน">สำเร็จบางส่วน</option>
                  <option value="ไม่สำเร็จ">ไม่สำเร็จ</option>
                </select>
              </div>
              <div className="field full">
                <p className="field-label">สรุปผลการดำเนินงาน</p>
                <textarea
                  className="field-input"
                  value={result.summary}
                  onChange={(e) =>
                    setResult((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="field full">
                <p className="field-label">งานที่ต้องติดตามต่อ</p>
                <textarea
                  className="field-input"
                  value={result.nextAction}
                  onChange={(e) =>
                    setResult((prev) => ({ ...prev, nextAction: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="job-detail-actions">
            <button className="btn-primary" type="button" onClick={handleSave}>
              บันทึกการอัปเดตของช่าง
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate(-1)}
              style={{ marginLeft: 10 }}
            >
              ย้อนกลับ
            </button>
            {saveMessage && <p className="save-message">{saveMessage}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
