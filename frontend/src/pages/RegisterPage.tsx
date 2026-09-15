import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import type { UserRole } from "../types";

export function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email,
        name,
        password,
        role,
        student_number: role === "student" ? studentNumber : undefined,
        school_name: schoolName || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(extractErrorMessage(err, "회원가입에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>회원가입</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            회원가입이 완료되었습니다. 로그인 화면으로 이동합니다...
          </div>
        )}

        <label className="field">
          <span>사용자 유형</span>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="student">학생</option>
            <option value="teacher">교사</option>
          </select>
        </label>

        <label className="field">
          <span>이름</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="field">
          <span>이메일</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span>비밀번호 (8자 이상)</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {role === "student" && (
          <label className="field">
            <span>학번</span>
            <input
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="예: 10203"
            />
          </label>
        )}

        <label className="field">
          <span>학교명 (선택)</span>
          <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
        </label>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "가입 중..." : "회원가입"}
        </button>

        <p className="auth-switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
