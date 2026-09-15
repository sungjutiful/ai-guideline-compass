import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { agreeToAssignment, getAssignment } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { PolicyBanner } from "../components/PolicyBanner";
import { ComplianceList } from "./TeacherDashboard";
import type { Assignment } from "../types";

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreeing, setAgreeing] = useState(false);
  const [checked, setChecked] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAssignment(Number(id));
      setAssignment(data);
    } catch (err) {
      setError(extractErrorMessage(err, "과제를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAgree() {
    if (!assignment) return;
    setAgreeing(true);
    setError(null);
    try {
      await agreeToAssignment(assignment.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "동의 처리에 실패했습니다."));
    } finally {
      setAgreeing(false);
    }
  }

  if (loading) return <div className="page">불러오는 중...</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!assignment) return null;

  const isStudent = user?.role === "student";
  const needsConsent = isStudent && assignment.student_has_consented === false;

  return (
    <div className="page">
      <PolicyBanner
        level={assignment.ai_policy_level}
        title={`${assignment.subject} · ${assignment.title}`}
        subtitle={
          assignment.due_date
            ? `마감: ${new Date(assignment.due_date).toLocaleString("ko-KR")}`
            : undefined
        }
      />

      <div className="card">
        <h2>과제 설명</h2>
        <p>{assignment.description || "설명이 등록되지 않았습니다."}</p>
        <h3>AI 활용 허용 범위</h3>
        <p>{assignment.policy_detail || "상세 설명이 등록되지 않았습니다."}</p>
      </div>

      {needsConsent && (
        <div className="card consent-card">
          <h2>AI 활용 기준 확인 및 동의</h2>
          <p>
            위 기준을 확인했으며, 과제 수행 중 AI 활용 여부와 방식을 이 기준에 따라
            준수하는 데 동의합니다.
          </p>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>위 AI 활용 기준을 확인했으며 동의합니다.</span>
          </label>
          <button
            className="btn btn-primary"
            disabled={!checked || agreeing}
            onClick={handleAgree}
          >
            {agreeing ? "처리 중..." : "동의하고 시작하기"}
          </button>
        </div>
      )}

      {isStudent && assignment.student_has_consented === true && (
        <div className="alert alert-success">이미 동의를 완료한 과제입니다.</div>
      )}

      {!isStudent && (
        <div className="card">
          <h2>가이드라인 자가진단 결과</h2>
          <ComplianceList assignment={assignment} />
        </div>
      )}
    </div>
  );
}
