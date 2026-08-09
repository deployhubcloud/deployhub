import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { ConfirmButton, EmptyState, PageHeader, StatusBadge } from '../components/ui'

export default function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [status, setStatus] = useState('active')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const res = await api.get(`/users/${userId}`)
      setData(res.data)
      setStatus(res.data.user.status)
      setFullName(res.data.user.fullName || '')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user')
    }
  }

  useEffect(() => { load() }, [userId])

  const save = async () => {
    setBusy(true)
    try {
      await api.patch(`/users/${userId}`, { status, fullName })
      toast.success('User updated')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const revokeSessions = async () => {
    setBusy(true)
    try {
      await api.post(`/users/${userId}/revoke-sessions`)
      toast.success('Sessions revoked')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const deleteProjects = async () => {
    setBusy(true)
    try {
      const res = await api.delete(`/users/${userId}/projects`)
      toast.success(res.data.message || 'Projects delete queued')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const deleteUser = async () => {
    setBusy(true)
    try {
      await api.delete(`/users/${userId}`, { params: { deleteProjects: true } })
      toast.success('User deleted (projects queued)')
      navigate('/users')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  if (!data?.user) return <div className="text-[var(--muted)]">Loading user…</div>
  const { user, sessions = [], projects = [], projectCount = 0 } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.fullName}
        subtitle={user.email}
        actions={
          <>
            <Link to="/users" className="btn btn-ghost">Back</Link>
            <StatusBadge value={user.status} />
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-3">
        <Mini label="Projects" value={projectCount} />
        <Mini label="Sessions" value={sessions.length} />
        <Mini label="Provider" value={user.provider} />
        <Mini label="Login attempts" value={user.loginAttempts ?? 0} />
      </div>

      <div className="tabs">
        {['overview', 'projects', 'sessions', 'danger'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="font-medium mb-4">Profile</div>
            <dl className="kv">
              <dt>User ID</dt><dd className="mono text-xs">{user._id}</dd>
              <dt>GitHub</dt><dd>{user.githubUsername || '—'}</dd>
              <dt>GitHub ID</dt><dd className="mono text-xs">{user.githubId || '—'}</dd>
              <dt>Network</dt><dd className="mono text-xs">{user.networkName}</dd>
              <dt>Created</dt><dd>{new Date(user.createdAt).toLocaleString()}</dd>
              <dt>Updated</dt><dd>{new Date(user.updatedAt).toLocaleString()}</dd>
              <dt>Locked until</dt><dd>{user.lockUntil ? new Date(user.lockUntil).toLocaleString() : '—'}</dd>
            </dl>
          </div>

          <div className="card p-5 space-y-3">
            <div className="font-medium">Edit user</div>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Full name</span>
              <input className="input mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Status</span>
              <select className="select mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="suspend">suspend</option>
              </select>
            </label>
            <button className="btn btn-primary" disabled={busy} onClick={save}>Save changes</button>
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="table-wrap card !shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>Status</th><th>Plan</th><th>Subdomain</th>
              </tr>
            </thead>
            <tbody>
              {projects.length ? projects.map((p) => (
                <tr key={p._id}>
                  <td><Link className="text-[#7ddeb0] hover:underline" to={`/projects/${p._id}`}>{p.name}</Link></td>
                  <td>{p.type}</td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>{p.plan}</td>
                  <td className="mono text-xs">{p.subdomain || '—'}</td>
                </tr>
              )) : <tr><td colSpan={5}><EmptyState title="No projects" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ConfirmButton
              disabled={busy}
              label="Revoke all sessions"
              confirmText="Force logout this user everywhere?"
              onConfirm={revokeSessions}
              className="btn btn-warn"
            />
          </div>
          <div className="table-wrap card !shadow-none">
            <table className="table">
              <thead>
                <tr><th>Device</th><th>IP</th><th>Token</th><th>Created</th></tr>
              </thead>
              <tbody>
                {sessions.length ? sessions.map((s) => (
                  <tr key={s.key}>
                    <td>{s.device || '—'}</td>
                    <td className="mono text-xs">{s.ip || '—'}</td>
                    <td className="mono text-xs text-[var(--muted)]">{s.tokenId}</td>
                    <td className="text-xs text-[var(--muted)]">{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                )) : <tr><td colSpan={4}><EmptyState title="No active sessions" /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'danger' && (
        <div className="card p-5 border-[rgba(212,84,84,.35)] space-y-4">
          <div>
            <div className="font-medium text-[#f0a0a0]">Danger zone</div>
            <p className="text-sm text-[var(--muted)] mt-1">
              Destructive actions cascade into project delete queues across build/deploy/monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ConfirmButton
              disabled={busy}
              label="Delete all user projects"
              confirmText="Queue delete for every project owned by this user?"
              onConfirm={deleteProjects}
            />
            <ConfirmButton
              disabled={busy}
              label="Delete user + projects"
              confirmText="Permanently delete this user and queue all project deletes?"
              onConfirm={deleteUser}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  )
}
