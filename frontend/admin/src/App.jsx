import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./layouts/AdminLayout";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import OverviewPage from "./pages/OverviewPage";
import AdminsPage from "./pages/AdminsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import SystemPage from "./pages/SystemPage";
import { EmptyState, ErrorState } from "./components/ui";
function PrivateRoute() {
  const { admin, loading, sessionError, refreshMe } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="session-loading" role="status">
        Checking your admin session…
      </div>
    );
  if (sessionError)
    return (
      <div className="session-loading">
        <ErrorState error={sessionError} retry={refreshMe} />
      </div>
    );
  if (!admin)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  return <AdminLayout />;
}
function RequirePerm({ permission, children }) {
  const { can } = useAuth();
  return can(permission) ? (
    children
  ) : (
    <EmptyState
      title="This area needs additional access"
      text="Your current role does not have permission to view this page."
      action={
        <Link className="btn btn-primary" to="/">
          Back to workspace
        </Link>
      }
    />
  );
}
function Home() {
  const { can } = useAuth();
  if (can("dashboard:read")) return <OverviewPage />;
  if (can("users:read")) return <Navigate to="/users" replace />;
  return <EmptyState title="No workspace access assigned" />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute />}>
        <Route index element={<Home />} />
        {[
          ["system", "system:manage", <SystemPage />],
          ["users", "users:read", <UsersPage />],
          ["users/:userId", "users:read", <UserDetailPage />],
          ["projects", "projects:read", <ProjectsPage />],
          ["projects/:projectId", "projects:read", <ProjectDetailPage />],
          ["admins", "admins:manage", <AdminsPage />],
          ["audit-logs", "audit:read", <AuditLogsPage />],
        ].map(([path, permission, page]) => (
          <Route
            key={path}
            path={path}
            element={<RequirePerm permission={permission}>{page}</RequirePerm>}
          />
        ))}
        <Route path="password" element={<ChangePasswordPage />} />
        <Route
          path="*"
          element={
            <EmptyState
              title="Page not found"
              action={
                <Link to="/" className="btn btn-primary">
                  Back to workspace
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}
