import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createAssignment, listAssignments } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { policyMeta } from "../components/PolicyBanner";
import type { Assignment, AiPolicyLevel } from "../types";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  compliant: { label: "준수", className: "badge-compliant" },
  violation: { label: "위반 가능성", className: "badge-violation" },
  ambiguous: { label: "확인 필요", className: "badge-ambiguous" },
};

export function TeacherDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<Assignment | null>(null);

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [policyLevel, setPolicyLevel] = useState<AiPolicyLevel>("limited");
  const [policyDetail, setPolicyDetail] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function loadAssignments() {
    setLoading(true);
    try {
      const data = await listAssignments();
      setAssignments(data);
    } catch (err) {
      setError(extractErrorMessage(err, "과제 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createAssignment({
        subject,
        title,
        description: description || undefined,
        ai_policy_level: policyLevel,
        policy_detail: policyDetail || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setLastCreated(created);
      setSubject("");
      setTitle("");
      setDescription("");
      setPolicyDetail("");
      setDueDate("");
      setShowForm(false);
      await loadAssignments();
    } catch (err) {
      setError(extractErrorMessage(err, "과제 등록에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>교사 대시보드</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "닫기" : "+ 새 과제 등록"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {lastCreated && (
        <div className="card">
          <h3>"{lastCreated.title}" 자가진단 결과</h3>
          <ComplianceList assignment={lastCreated} />
        </div>
      )}

      {showForm && (
        <form className="card" onSubmit={handleSubmit}>
          <h2>새 과제 등록</h2>
          <div className="form-grid">
            <label className="field">
              <span>과목</span>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="field">
              <span>과제 제목</span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
          </div>

          <label className="field">
            <span>과제 설명</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="field">
            <span>AI 활용 기준</span>
            <select
              value={policyLevel}
              onChange={(e) => setPolicyLevel(e.target.value as AiPolicyLevel)}
            >
              <option value="prohibited">금지</option>
              <option value="limited">제한적 허용</option>
              <option value="full">전면 허용</option>
            </select>
          </label>

          <label className="field">
            <span>허용 범위 상세 설명</span>
            <textarea
              rows={3}
              value={policyDetail}
              onChange={(e) => setPolicyDetail(e.target.value)}
              placeholder="예: 자료 조사 단계에서만 제한적으로 허용, 최종 서술은 직접 작성"
            />
          </label>

          <label className="field">
            <span>마감일 (선택)</span>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "등록 및 가이드라인 자동 대조"}
          </button>
        </form>
      )}

      <div className="card">
        <h2>내가 등록한 과제</h2>
        {loading && <p>불러오는 중...</p>}
        {!loading && assignments.length === 0 && (
          <p className="text-muted">등록된 과제가 없습니다.</p>
        )}
        <ul className="assignment-list">
          {assignments.map((a) => {
            const meta = policyMeta(a.ai_policy_level);
            return (
              <li key={a.id} className="assignment-item">
                <Link to={`/assignments/${a.id}`}>
                  <span className={`chip ${meta.className}`}>{meta.label}</span>
                  <strong>{a.title}</strong>
                  <span className="text-muted"> · {a.subject}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function ComplianceList({ assignment }: { assignment: Assignment }) {
  const checks = assignment.compliance_checks ?? [];
  if (checks.length === 0) {
    return <p className="text-muted">비교할 가이드라인 조항이 없습니다.</p>;
  }
  return (
    <ul className="compliance-list">
      {checks.map((c) => {
        const meta = STATUS_LABEL[c.status];
        return (
          <li key={c.id} className="compliance-item">
            <span className={`badge ${meta.className}`}>{meta.label}</span>
            <span className="text-muted">
              {c.similarity_score != null
                ? ` 유사도 ${(c.similarity_score * 100).toFixed(0)}%`
                : ""}
            </span>
            <p>{c.note}</p>
          </li>
        );
      })}
    </ul>
  );
}
