import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizQuestions, getQuizStatus, submitQuiz } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import type { QuizQuestion, QuizSubmitResult } from "../types";

export function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [qs, status] = await Promise.all([getQuizQuestions(), getQuizStatus()]);
        setQuestions(qs);
        setAlreadyPassed(status.has_passed);
      } catch (err) {
        setError(extractErrorMessage(err, "퀴즈를 불러오지 못했습니다."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError("모든 문항에 답해 주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitQuiz(answers);
      setResult(res);
    } catch (err) {
      setError(extractErrorMessage(err, "제출에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page">불러오는 중...</div>;

  return (
    <div className="page">
      <h1>사전교육 체크리스트</h1>
      <p className="text-muted">
        AI 활용 기준에 동의하기 전, 아래 문항에 답해 기본적인 윤리·개인정보 보호
        원칙을 확인해 주세요. {questions.length}문항 중 80% 이상 맞히면 통과합니다.
      </p>

      {alreadyPassed && !result && (
        <div className="alert alert-success">
          이미 사전교육을 통과했습니다. 다시 응시하지 않아도 과제에 동의할 수 있습니다.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!result && (
        <div className="card">
          {questions.map((q, idx) => (
            <div key={q.id} className="quiz-question">
              <p>
                <strong>
                  {idx + 1}. {q.question}
                </strong>
              </p>
              <div className="quiz-options">
                <label>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === true}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
                  />
                  참
                </label>
                <label>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === false}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
                  />
                  거짓
                </label>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "채점 중..." : "제출하기"}
          </button>
        </div>
      )}

      {result && (
        <div className="card">
          <h2>{result.passed ? "통과했습니다!" : "아쉽지만 통과하지 못했습니다."}</h2>
          <p>
            {result.total}문항 중 {result.score}문항 정답 ({Math.round((result.score / result.total) * 100)}%)
          </p>
          {result.passed ? (
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              돌아가서 동의하기
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              다시 응시하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
