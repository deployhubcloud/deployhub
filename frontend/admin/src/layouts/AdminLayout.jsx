import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Boxes, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
    isActive
      ? 'bg-[var(--accent)]/20 text-[var(--text)]'
      : 'text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]'
  }`

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--line)] bg-[var(--panel)]/80 backdrop-blur p-4 flex flex-col">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">DeployHub</div>
          <div className="text-xl font-semibold mt-1">Admin</div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard size={16} /> Overview
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            <Users size={16} /> Users
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            <Boxes size={16} /> Projects
          </NavLink>
        </nav>

        <div className="mt-auto pt-6 border-t border-[var(--line)]">
          <div className="text-xs text-[var(--muted)] mb-2">{admin?.email}</div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--panel-2)] hover:bg-[var(--danger)]/20"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="p-6 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
