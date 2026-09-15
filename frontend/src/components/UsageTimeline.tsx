import type { UsageLogEntry, UsageSummary } from "../types";

const TYPE_META: Record<
  string,
  { label: string; colorClass: "usage-ai" | "usage-self"; icon: string }
> = {
  ai_prompt: { label: "AI 질문", colorClass: "usage-ai", icon: "💬" },
  ai_response: { label: "AI 응답 활용", colorClass: "usage-ai", icon: "🤖" },
  self_written: { label: "직접 작성", colorClass: "usage-self", icon: "✍️" },
};

export function UsageTimeline({ summary }: { summary: UsageSummary }) {
  const { total_entries, ai_entries, self_written_entries, ai_usage_ratio } = summary;
  const aiPct = total_entries > 0 ? Math.round(ai_usage_ratio * 100) : 0;
  const selfPct = 100 - aiPct;

  return (
    <div className="usage-timeline">
      {total_entries === 0 ? (
        <p className="text-muted">아직 기록된 활용 내역이 없습니다.</p>
      ) : (
        <>
          <div className="usage-ratio-bar" role="img" aria-label={`AI 활용 ${aiPct}%, 직접 작성 ${selfPct}%`}>
            {ai_entries > 0 && (
              <div
                className="usage-ratio-segment usage-ai"
                style={{ width: `${aiPct}%` }}
              >
                {aiPct >= 12 && <span>{aiPct}%</span>}
              </div>
            )}
            {self_written_entries > 0 && (
              <div
                className="usage-ratio-segment usage-self"
                style={{ width: `${selfPct}%` }}
              >
                {selfPct >= 12 && <span>{selfPct}%</span>}
              </div>
            )}
          </div>
          <div className="usage-legend">
            <span className="usage-legend-item">
              <i className="usage-swatch usage-ai" /> AI 활용 {ai_entries}건 ({aiPct}%)
            </span>
            <span className="usage-legend-item">
              <i className="usage-swatch usage-self" /> 직접 작성 {self_written_entries}건 ({selfPct}%)
            </span>
          </div>

          <ol className="usage-log-list">
            {summary.entries.map((entry) => (
              <UsageLogRow key={entry.id} entry={entry} />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function UsageLogRow({ entry }: { entry: UsageLogEntry }) {
  const meta = TYPE_META[entry.entry_type];
  return (
    <li className={`usage-log-row usage-log-row--${meta.colorClass === "usage-ai" ? "ai" : "self"}`}>
      <span className="usage-log-marker" aria-hidden="true">
        {meta.icon}
      </span>
      <div className="usage-log-body">
        <div className="usage-log-meta">
          <span className={`chip-sm ${meta.colorClass}`}>{meta.label}</span>
          {entry.student_name && (
            <span className="text-muted"> · {entry.student_name}</span>
          )}
          {entry.source_tool && <span className="text-muted"> · {entry.source_tool}</span>}
          <span className="text-muted">
            {" "}
            · {new Date(entry.created_at).toLocaleString("ko-KR")}
          </span>
          {entry.pii_detected && (
            <span className="chip-sm usage-pii">개인정보 마스킹됨</span>
          )}
        </div>
        <p className="usage-log-content">{entry.content}</p>
      </div>
    </li>
  );
}
