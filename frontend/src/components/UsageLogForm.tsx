import { useState, type FormEvent } from "react";
import { createUsageLog } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { detectPiiLabels } from "../utils/pii";
import type { UsageEntryType } from "../types";

export function UsageLogForm({
  assignmentId,
  onLogged,
}: {
  assignmentId: number;
  onLogged: () => void;
}) {
  const [entryType, setEntryType] = useState<UsageEntryType>("ai_prompt");
  const [content, setContent] = useState("");
  const [sourceTool, setSourceTool] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWarning, setSavedWarning] = useState<string[] | null>(null);

  const livePiiWarnings = detectPiiLabels(content);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setSavedWarning(null);
    setSubmitting(true);
    try {
      const result = await createUsageLog(
        assignmentId,
        entryType,
        content,
        sourceTool || undefined
      );
      if (result.pii_warnings?.length > 0) {
        setSavedWarning(result.pii_warnings);
      }
      setContent("");
      setSourceTool("");
      onLogged();
    } catch (err) {
      setError(extractErrorMessage(err, "기록 저장에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="usage-log-form" onSubmit={handleSubmit}>
      <h3>활용 내역 기록하기</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {savedWarning && (
        <div className="alert alert-warning">
          개인정보({savedWarning.join(", ")})가 감지되어 자동으로 마스킹 처리 후
          저장했습니다.
        </div>
      )}

      <label className="field">
        <span>구분</span>
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as UsageEntryType)}
        >
          <option value="ai_prompt">AI에게 한 질문(프롬프트)</option>
          <option value="ai_response">AI 응답 중 활용한 내용</option>
          <option value="self_written">직접 작성한 구간</option>
        </select>
      </label>

      {entryType !== "self_written" && (
        <label className="field">
          <span>사용한 AI 도구 (선택)</span>
          <input
            value={sourceTool}
            onChange={(e) => setSourceTool(e.target.value)}
            placeholder="예: ChatGPT, Claude"
          />
        </label>
      )}

      <label className="field">
        <span>내용</span>
        <textarea
          rows={3}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            entryType === "self_written"
              ? "예: 서론 문단을 직접 작성함"
              : "질문/활용한 내용을 입력하세요"
          }
        />
      </label>

      {livePiiWarnings.length > 0 && (
        <div className="alert alert-warning">
          입력한 내용에 {livePiiWarnings.join(", ")}(으)로 보이는 정보가 있습니다.
          제출 시 자동으로 마스킹되지만, 가능하면 직접 지우고 입력해 주세요.
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "저장 중..." : "기록 추가"}
      </button>
    </form>
  );
}
