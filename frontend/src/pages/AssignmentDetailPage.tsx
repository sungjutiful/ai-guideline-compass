import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  agreeToAssignment,
  getAssignment,
  getUsageSummary,
} from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { PolicyBanner } from "../components/PolicyBanner";
import { ComplianceList } from "./TeacherDashboard";
import { UsageTimeline } from "../components/UsageTimeline";
import { UsageLogForm } from "../components/UsageLogForm";
import type { Assignment, UsageSummary } from "../types";

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsQuiz, setNeedsQuiz] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [checked, setChecked] = useState(false);

  async function loadUsage(assignmentId: number) {
    try {
      setUsageSummary(await getUsageSummary(assignmentId));
    } catch {
      // 활용 내역은 부가 정보이므로 조회 실패 시 조용히 무시합니다.
    }
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAssignment(Number(id));
      setAssignment(data);
      if (data.student_has_consented !== false) {
        await loadUsage(data.id);
      } else if (user?.role !== "student") {
        await loadUsage(data.id);
      }
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
    setNeedsQuiz(false);
    try {
      await agreeToAssignment(assignment.id);
      await load();
    } catch (err) {
      const message = extractErrorMessage(err, "동의 처리에 실패했습니다.");
      if (message.includes("사전교육 퀴즈")) {
        setNeedsQuiz(true);
      }
      setError(message);
    } finally {
      setAgreeing(false);
    }
  }

  if (loading) return <div className="page">불러오는 중...</div>;
  if (error && !assignment)
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  if (!assignment) return null;

  const isStudent = user?.role === "student";
  const needsConsent = isStudent && assignment.student_has_consented === false;
  const canLogUsage = isStudent && assignment.student_has_consented === true;

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

          {error && <div className="alert alert-error">{error}</div>}
          {needsQuiz && (
            <div className="alert alert-warning">
              사전교육 체크리스트를 먼저 통과해야 동의할 수 있습니다.{" "}
              <Link to="/quiz">사전교육 하러 가기</Link>
            </div>
          )}

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

      {canLogUsage && (
        <div className="card">
          <UsageLogForm assignmentId={assignment.id} onLogged={() => loadUsage(assignment.id)} />
        </div>
      )}

      {usageSummary && (
        <div className="card">
          <h2>AI 활용 이력 타임라인</h2>
          <UsageTimeline summary={usageSummary} />
        </div>
      )}
    </div>
  );
}
