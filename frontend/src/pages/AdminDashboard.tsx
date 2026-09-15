import { useEffect, useState } from "react";
import { getAdminStats } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import type { AdminStats } from "../types";

const ROLE_LABEL: Record<string, string> = {
  teacher: "교사",
  student: "학생",
  admin: "관리자",
};

const POLICY_LABEL: Record<string, string> = {
  prohibited: "금지",
  limited: "제한적 허용",
  full: "전면 허용",
};

const STATUS_LABEL: Record<string, string> = {
  compliant: "준수",
  violation: "위반 가능성",
  ambiguous: "확인 필요",
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(extractErrorMessage(err, "통계를 불러오지 못했습니다.")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">불러오는 중...</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!stats) return null;

  return (
    <div className="page">
      <h1>관리자 대시보드</h1>
      <p className="text-muted">학교/교육청 전체 현황을 한눈에 확인합니다.</p>

      <div className="stat-grid">
        <StatCard label="전체 과제 수" value={stats.total_assignments} />
        <StatCard label="학생 동의 건수" value={stats.total_consents} />
        <StatCard label="가이드라인 문서 수" value={stats.total_guideline_documents} />
        <StatCard label="개인정보 감지 건수" value={stats.total_pii_flags} />
        <StatCard
          label="사전교육 통과율"
          value={`${Math.round(stats.quiz_pass_rate * 100)}%`}
          sub={`${stats.total_quiz_attempts}회 응시`}
        />
      </div>

      <div className="card">
        <h2>사용자 현황</h2>
        <ul className="stat-list">
          {Object.entries(stats.user_counts).map(([role, count]) => (
            <li key={role}>
              <span>{ROLE_LABEL[role] || role}</span>
              <strong>{count}명</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>과제별 AI 활용 기준 분포</h2>
        <ul className="stat-list">
          {Object.entries(stats.policy_level_counts).map(([level, count]) => (
            <li key={level}>
              <span>{POLICY_LABEL[level] || level}</span>
              <strong>{count}건</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>가이드라인 자가진단 결과 분포</h2>
        <ul className="stat-list">
          {Object.entries(stats.compliance_status_counts).map(([status, count]) => (
            <li key={status}>
              <span>{STATUS_LABEL[status] || status}</span>
              <strong>{count}건</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
