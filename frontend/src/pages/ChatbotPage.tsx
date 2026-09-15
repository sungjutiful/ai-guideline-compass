import { useState, type FormEvent } from "react";
import { askChatbot } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import type { ChatHistoryItem } from "../types";

export function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setError(null);
    setLoading(true);
    const askedQuestion = question;
    setQuestion("");
    try {
      const response = await askChatbot(askedQuestion);
      setHistory((prev) => [...prev, { ...response, question: askedQuestion }]);
    } catch (err) {
      setError(extractErrorMessage(err, "챗봇 응답을 가져오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>가이드라인 챗봇</h1>
      <p className="text-muted">
        "이거 써도 돼?" 궁금할 때 언제든 물어보세요. 업로드된 가이드라인 조항을
        근거로 답변합니다.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="chat-window">
        {history.length === 0 && (
          <div className="chat-empty text-muted">
            아직 대화가 없습니다. 예: "수학 수행평가에 AI 써도 돼?"
          </div>
        )}
        {history.map((item, idx) => (
          <div key={idx} className="chat-turn">
            <div className="chat-bubble chat-question">{item.question}</div>
            <div
              className={`chat-bubble chat-answer ${
                item.needs_teacher_check ? "chat-answer-warning" : ""
              }`}
            >
              <p style={{ whiteSpace: "pre-wrap" }}>{item.answer}</p>
              {item.needs_teacher_check && (
                <div className="chat-flag">담당 교사에게 확인이 필요한 답변입니다.</div>
              )}
              {item.sources.length > 0 && (
                <details className="chat-sources">
                  <summary>근거 조항 {item.sources.length}건 보기</summary>
                  <ul>
                    {item.sources.map((s) => (
                      <li key={s.clause_id}>
                        <strong>
                          {s.document_title} {s.clause_number || ""}
                        </strong>
                        <p>{s.content}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="궁금한 내용을 입력하세요"
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "답변 생성 중..." : "질문하기"}
        </button>
      </form>
    </div>
  );
}
