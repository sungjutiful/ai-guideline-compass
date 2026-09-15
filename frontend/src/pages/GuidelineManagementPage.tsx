import { useEffect, useState, type FormEvent } from "react";
import { listGuidelines, uploadGuideline } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import type { GuidelineDocument } from "../types";

export function GuidelineManagementPage() {
  const [documents, setDocuments] = useState<GuidelineDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setDocuments(await listGuidelines());
    } catch (err) {
      setError(extractErrorMessage(err, "가이드라인 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("업로드할 파일을 선택해 주세요.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      const result = await uploadGuideline(title, source, version, file);
      setSuccessMessage(
        `"${result.document.title}" 문서에서 조항 ${result.clause_count}건을 등록했습니다.`
      );
      setTitle("");
      setSource("");
      setVersion("");
      setFile(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "업로드에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>가이드라인 문서 관리</h1>
      <p className="text-muted">
        교육부·교육청 공식 지침 문서를 업로드하면 조항 단위로 분리되어 챗봇 검색과
        과제 자가진단에 활용됩니다.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <h2>문서 업로드</h2>
        <div className="form-grid">
          <label className="field">
            <span>문서 제목</span>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span>출처 (예: 교육부, OO교육청)</span>
            <input required value={source} onChange={(e) => setSource(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>버전 (선택)</span>
          <input value={version} onChange={(e) => setVersion(e.target.value)} />
        </label>
        <label className="field">
          <span>파일 (PDF 또는 텍스트)</span>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "업로드 중..." : "업로드"}
        </button>
      </form>

      <div className="card">
        <h2>등록된 가이드라인 문서</h2>
        {loading && <p>불러오는 중...</p>}
        {!loading && documents.length === 0 && (
          <p className="text-muted">등록된 문서가 없습니다.</p>
        )}
        <ul className="document-list">
          {documents.map((doc) => (
            <li key={doc.id} className="document-item">
              <strong>{doc.title}</strong>
              <span className="text-muted">
                {" "}
                · {doc.source} {doc.version ? `(v${doc.version})` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
