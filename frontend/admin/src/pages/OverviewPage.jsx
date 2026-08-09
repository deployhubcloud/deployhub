import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function OverviewPage() {
  const [stats, setStats] = useState({ users: 0, projects: 0, loading: true })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          api.get('/users', { params: { page: 1, limit: 1 } }),
          api.get('/projects', { params: { page: 1, limit: 1 } }),
        ])
        if (!alive) return
        setStats({
          users: usersRes.data.pagination?.total || 0,
          projects: projectsRes.data.pagination?.total || 0,
          loading: false,
        })
      } catch {
        if (alive) setStats((s) => ({ ...s, loading: false }))
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-semibold">Overview</h1>
      <p className="text-[var(--muted)] mt-2">Platform snapshot for operators.</p>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Link to="/users" className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 hover:border-[var(--accent)] transition">
          <div className="text-sm text-[var(--muted)]">Users</div>
          <div className="text-4xl font-semibold mt-2">{stats.loading ? '—' : stats.users}</div>
        </Link>
        <Link to="/projects" className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 hover:border-[var(--accent)] transition">
          <div className="text-sm text-[var(--muted)]">Projects</div>
          <div className="text-4xl font-semibold mt-2">{stats.loading ? '—' : stats.projects}</div>
        </Link>
      </div>
    </div>
  )
}
