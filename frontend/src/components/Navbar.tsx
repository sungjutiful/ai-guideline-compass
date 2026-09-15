import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  teacher: "교사",
  student: "학생",
  admin: "관리자",
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          AI 가이드라인 준수 플랫폼
        </Link>
        <nav className="navbar-links">
          <Link to="/">대시보드</Link>
          <Link to="/chatbot">가이드라인 챗봇</Link>
          {user.role === "student" && <Link to="/quiz">사전교육 체크리스트</Link>}
          {(user.role === "teacher" || user.role === "admin") && (
            <Link to="/guidelines">가이드라인 관리</Link>
          )}
          {user.role === "admin" && <Link to="/admin">관리자 통계</Link>}
        </nav>
        <div className="navbar-user">
          <span className="badge badge-role">{ROLE_LABEL[user.role]}</span>
          <span>{user.name}님</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
