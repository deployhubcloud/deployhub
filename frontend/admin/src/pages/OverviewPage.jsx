import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PageHeader, StatCard } from '../components/ui'

export default function OverviewPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.get('/dashboard')
        if (alive) setData(res.data)
      } catch {
        if (alive) setData(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const users = data?.users || {}
  const projects = data?.projects || {}
  const builds = data?.builds || {}
  const deployments = data?.deployments || {}

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Live platform health across identity, projects, builds, and deployments."
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Users" value={loading ? '—' : users.total} hint="All accounts" onClick={() => navigate('/users')} />
        <StatCard label="Projects" value={loading ? '—' : projects.total} hint={`${projects.running || 0} running`} onClick={() => navigate('/projects')} />
        <StatCard label="Builds" value={loading ? '—' : builds.total} hint={`${builds.byStatus?.failed || 0} failed`} />
        <StatCard label="Deployments" value={loading ? '—' : deployments.total} hint={`${deployments.byStatus?.live || 0} live`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card p-5">
          <div className="text-sm font-medium mb-3">Users by status</div>
          <Breakdown map={users.byStatus} />
        </div>
        <div className="card p-5">
          <div className="text-sm font-medium mb-3">Projects by status</div>
          <Breakdown map={projects.byStatus} />
        </div>
        <div className="card p-5">
          <div className="text-sm font-medium mb-3">Projects by plan</div>
          <Breakdown map={projects.byPlan} />
        </div>
      </div>

      {data?.cached ? (
        <p className="text-xs text-[var(--muted)] mt-4">Dashboard cached for 5 minutes</p>
      ) : null}
    </div>
  )
}

function Breakdown({ map }) {
  const entries = Object.entries(map || {})
  if (!entries.length) return <div className="text-sm text-[var(--muted)]">No data</div>
  const max = Math.max(...entries.map(([, n]) => Number(n) || 0), 1)
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--muted)] capitalize">{k}</span>
            <span className="tabular-nums">{v}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--panel-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${(Number(v) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
