import { Component, Suspense, lazy, useEffect } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import Shell, { ProjectFrame } from './components/Shell'
import { LoadState } from './components/ui'
import { Dashboard, Projects, WorkspaceAnalytics, WorkspaceBilling } from './pages/Workspace'
import Auth from './pages/Auth'
import Deployments, { BuildLogPage } from './pages/Deployments'
import { ProjectLogs, ProjectMetrics, ProjectOverview } from './pages/ProjectDetail'
import ProjectTypes from './pages/ProjectTypes'

const NewProject = lazy(() => import('./pages/NewProject'))
const Profile = lazy(() => import('./pages/Profile'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Settings = lazy(() =>
  import('./pages/Project/Settings').then((m) => ({ default: m.Settings })),
)
const Domain = lazy(() => import('./pages/Project/Domain').then((m) => ({ default: m.Domain })))
const Billing = lazy(() => import('./pages/Project/Billing').then((m) => ({ default: m.Billing })))

function Protected() {
  const { isAuthenticated, isAuthReady } = useAuth(),
    location = useLocation()
  if (!isAuthReady) return <LoadState loading />
  return isAuthenticated ? (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}
function Migrated({ children }) {
  return (
    <div className="configuration-page">
      <Suspense fallback={<LoadState loading />}>{children}</Suspense>
    </div>
  )
}
function RouteRefresh() {
  const { reload, reloadBuilds } = useWorkspace()
  useEffect(() => {
    reload()
    reloadBuilds()
  }, [reload, reloadBuilds])
  return <ProjectFrame />
}
class PageErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="error-state">
        <h1>This page ran into a problem.</h1>
        <p>Your workspace is still here. Reload to try again.</p>
        <button className="btn primary" onClick={() => window.location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function App() {
  useEffect(() => {
    const rate = (e) =>
      toast.error(e.detail?.message || 'Please wait before trying again.', { id: 'rate-limit' })
    const down = (e) =>
      toast.error(e.detail?.message || 'Services are temporarily unavailable. Please try again.', {
        id: 'service-down',
        duration: 6000,
      })
    window.addEventListener('deployhub:rate-limit', rate)
    window.addEventListener('deployhub:service-down', down)
    return () => {
      window.removeEventListener('deployhub:rate-limit', rate)
      window.removeEventListener('deployhub:service-down', down)
    }
  }, [])
  return (
    <PageErrorBoundary>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth key="signup" signup />} />
        <Route element={<Protected />}>
          <Route element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="deployments" element={<Deployments />} />
            <Route path="Builds" element={<Navigate replace to="/deployments" />} />
            <Route path="analytics" element={<WorkspaceAnalytics />} />
            <Route path="billing" element={<WorkspaceBilling />} />
            <Route path="projects/new" element={<ProjectTypes />} />
            <Route
              path="projects/new/:type"
              element={
                <Migrated>
                  <NewProject />
                </Migrated>
              }
            />
            <Route
              path="profile"
              element={
                <Migrated>
                  <Profile />
                </Migrated>
              }
            />
            <Route
              path="settings/sessions"
              element={
                <Migrated>
                  <Sessions />
                </Migrated>
              }
            />
            <Route path="project/:id" element={<RouteRefresh />}>
              <Route index element={<ProjectOverview />} />
              <Route path="builds" element={<Deployments />} />
              <Route path="logs" element={<ProjectLogs />} />
              <Route path="logs/:buildId" element={<BuildLogPage />} />
              <Route path="metrics" element={<ProjectMetrics />} />
              <Route
                path="settings"
                element={
                  <Migrated>
                    <Settings />
                  </Migrated>
                }
              />
              <Route
                path="domains"
                element={
                  <Migrated>
                    <Domain />
                  </Migrated>
                }
              />
              <Route
                path="billing"
                element={
                  <Migrated>
                    <Billing />
                  </Migrated>
                }
              />
            </Route>
            <Route
              path="*"
              element={
                <div className="not-found">
                  <span>404</span>
                  <h1>A little off the beaten path.</h1>
                  <p>This page doesn’t exist. Let’s get you back to building.</p>
                  <Link className="btn primary" to="/">
                    Back to your workspace
                  </Link>
                </div>
              }
            />
          </Route>
        </Route>
      </Routes>
    </PageErrorBoundary>
  )
}
