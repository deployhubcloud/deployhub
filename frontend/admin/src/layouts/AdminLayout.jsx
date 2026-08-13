import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Boxes, LogOut, Shield, UserCog, ScrollText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
    isActive
      ? 'bg-[var(--accent-soft)] text-[var(--text)] border border-[rgba(47,158,108,.25)]'
      : 'text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)] border border-transparent'
  }`

export default function AdminLayout() {
  const { admin, logout, isSuper, can } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-[var(--line)] bg-[var(--bg-elevated)]/90 backdrop-blur-xl p-5 flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="mb-8 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-soft)] border border-[rgba(47,158,108,.3)] grid place-items-center">
            <Shield size={18} className="text-[#7ddeb0]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">DeployHub</div>
            <div className="text-lg font-semibold leading-tight">Control Plane</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {can('dashboard:read') && (
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard size={16} /> Overview
            </NavLink>
          )}
          {can('users:read') && (
            <NavLink to="/users" className={linkClass}>
              <Users size={16} /> Users
            </NavLink>
          )}
          {can('projects:read') && (
            <NavLink to="/projects" className={linkClass}>
              <Boxes size={16} /> Projects
            </NavLink>
          )}
          {can('admins:manage') && (
            <NavLink to="/admins" className={linkClass}>
              <UserCog size={16} /> Admins
            </NavLink>
          )}
          {can('audit:read') && (
            <NavLink to="/audit-logs" className={linkClass}>
              <ScrollText size={16} /> Audit Logs
            </NavLink>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-[var(--line)] space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Signed in</div>
            <div className="text-sm mt-1 truncate">{admin?.email}</div>
            <div className="text-xs text-[var(--muted)] mono mt-0.5">{admin?.username || admin?.adminId}</div>
            <div className="mt-2">
              <span className={`badge ${isSuper ? 'badge-amber' : 'badge-blue'}`}>
                {isSuper ? 'super admin' : 'normal admin'}
              </span>
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-ghost w-full justify-start">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="p-6 md:p-8 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
