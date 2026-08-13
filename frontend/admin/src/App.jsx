import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import OverviewPage from './pages/OverviewPage'
import AdminsPage from './pages/AdminsPage'
import AuditLogsPage from './pages/AuditLogsPage'

function PrivateRoute({ children }) {
  const { admin, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-[var(--muted)]">
        Checking session…
      </div>
    )
  }
  if (!admin) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return null
  if (admin) return <Navigate to="/" replace />
  return children
}

function RequirePerm({ permission, children }) {
  const { can, loading } = useAuth()
  if (loading) return null
  if (!can(permission)) return <Navigate to="/users" replace />
  return children
}

function HomeRedirect() {
  const { can } = useAuth()
  if (can('dashboard:read')) return <OverviewPage />
  return <Navigate to="/users" replace />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="users"
          element={
            <RequirePerm permission="users:read">
              <UsersPage />
            </RequirePerm>
          }
        />
        <Route
          path="users/:userId"
          element={
            <RequirePerm permission="users:read">
              <UserDetailPage />
            </RequirePerm>
          }
        />
        <Route
          path="projects"
          element={
            <RequirePerm permission="projects:read">
              <ProjectsPage />
            </RequirePerm>
          }
        />
        <Route
          path="projects/:projectId"
          element={
            <RequirePerm permission="projects:read">
              <ProjectDetailPage />
            </RequirePerm>
          }
        />
        <Route
          path="admins"
          element={
            <RequirePerm permission="admins:manage">
              <AdminsPage />
            </RequirePerm>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RequirePerm permission="audit:read">
              <AuditLogsPage />
            </RequirePerm>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
