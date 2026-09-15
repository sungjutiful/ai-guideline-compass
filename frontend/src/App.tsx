import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AssignmentDetailPage } from "./pages/AssignmentDetailPage";
import { ChatbotPage } from "./pages/ChatbotPage";
import { GuidelineManagementPage } from "./pages/GuidelineManagementPage";
import { QuizPage } from "./pages/QuizPage";

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "student") return <StudentDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <TeacherDashboard />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/:id"
            element={
              <ProtectedRoute>
                <AssignmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <ChatbotPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guidelines"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <GuidelineManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
