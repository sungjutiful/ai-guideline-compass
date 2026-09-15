import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentDashboardAssignment, listAssignments } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { PolicyBanner, policyMeta } from "../components/PolicyBanner";
import type { Assignment } from "../types";

export function StudentDashboard() {
  const [current, setCurrent] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [currentAssignment, all] = await Promise.all([
          getCurrentDashboardAssignment(),
          listAssignments(),
        ]);
        setCurrent(currentAssignment);
        setAssignments(all);
      } catch (err) {
        setError(extractErrorMessage(err, "대시보드 정보를 불러오지 못했습니다."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <h1>학생 대시보드</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {loading && <p>불러오는 중...</p>}

      {!loading && current && (
        <Link to={`/assignments/${current.id}`} className="banner-link">
          <PolicyBanner
            level={current.ai_policy_level}
            title={`${current.subject} · ${current.title}`}
            subtitle={
              current.due_date
                ? `마감: ${new Date(current.due_date).toLocaleString("ko-KR")}`
                : undefined
            }
          />
        </Link>
      )}

      {!loading && !current && (
        <div className="card">
          <p className="text-muted">현재 표시할 과제가 없습니다.</p>
        </div>
      )}

      <div className="card">
        <h2>전체 과제 목록</h2>
        {assignments.length === 0 && (
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
