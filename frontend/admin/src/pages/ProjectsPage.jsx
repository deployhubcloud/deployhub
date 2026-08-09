import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { EmptyState, PageHeader, StatusBadge } from '../components/ui'

export default function ProjectsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const [type, setType] = useState('')
  const [data, setData] = useState({ projects: [] })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/projects', {
        params: {
          q,
          status: status || undefined,
          plan: plan || undefined,
          type: type || undefined,
          page: 1,
          limit: 100,
        },
      })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Filter by status/plan/type. Open any project for full infrastructure detail."
        actions={
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              load()
            }}
          >
            <input className="input min-w-[220px]" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name / subdomain / domain / repo" />
            <select className="select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status</option>
              {['queued','building','deploying','running','failed','stopped','crash','draft'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select className="select w-auto" value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="">Plan</option>
              <option value="free">free</option>
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
            <select className="select w-auto" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Type</option>
              {['static','node','go','python','java'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary">Filter</button>
          </form>
        }
      />

      <div className="table-wrap card !shadow-none">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Type</th>
              <th>Plan</th>
              <th>Subdomain</th>
              <th>Port</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-[var(--muted)]">Loading…</td></tr>
            ) : data.projects?.length ? data.projects.map((p) => (
              <tr key={p._id}>
                <td>
                  <Link to={`/projects/${p._id}`} className="font-medium text-[#7ddeb0] hover:underline">{p.name}</Link>
                  <div className="text-[11px] text-[var(--muted)] mono">{p._id}</div>
                </td>
                <td><StatusBadge value={p.status} /></td>
                <td>{p.type}</td>
                <td>{p.plan}</td>
                <td className="mono text-xs">{p.subdomain || '—'}</td>
                <td className="mono text-xs">{p.assignedPort || p.port || '—'}</td>
                <td>
                  <Link className="text-xs text-[var(--muted)] hover:text-[var(--text)]" to={`/users/${p.userId}`}>
                    {String(p.userId).slice(-6)}
                  </Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7}><EmptyState title="No projects found" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
