import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'

export default function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('active')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [userRes, projectsRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get('/projects', { params: { userId, limit: 100 } }),
      ])
      setUser(userRes.data.user)
      setStatus(userRes.data.user.status)
      setProjects(projectsRes.data.projects || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user')
    }
  }

  useEffect(() => {
    load()
  }, [userId])

  const saveStatus = async () => {
    setBusy(true)
    try {
      const { data } = await api.patch(`/users/${userId}`, { status })
      setUser(data.user)
      toast.success('User updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const removeUser = async () => {
    if (!confirm('Delete this user permanently?')) return
    setBusy(true)
    try {
      await api.delete(`/users/${userId}`)
      toast.success('User deleted')
      navigate('/users')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return <div className="text-[var(--muted)]">Loading user…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/users" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">← Users</Link>
        <h1 className="text-3xl font-semibold mt-2">{user.fullName}</h1>
        <p className="text-[var(--muted)]">{user.email}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 space-y-2 text-sm">
          <div><span className="text-[var(--muted)]">Status:</span> {user.status}</div>
          <div><span className="text-[var(--muted)]">Provider:</span> {user.provider}</div>
          <div><span className="text-[var(--muted)]">GitHub:</span> {user.githubUsername || '—'}</div>
          <div><span className="text-[var(--muted)]">Network:</span> <span className="mono text-xs">{user.networkName}</span></div>
          <div><span className="text-[var(--muted)]">Created:</span> {new Date(user.createdAt).toLocaleString()}</div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 space-y-3">
          <div className="text-sm font-medium">Admin actions</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
          >
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="suspend">suspend</option>
          </select>
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={saveStatus}
              className="rounded-lg bg-[var(--accent)] text-black px-4 py-2 font-medium disabled:opacity-60"
            >
              Save status
            </button>
            <button
              disabled={busy}
              onClick={removeUser}
              className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2"
            >
              Delete user
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Projects ({projects.length})</h2>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--panel-2)] text-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subdomain</th>
              </tr>
            </thead>
            <tbody>
              {projects.length ? projects.map((p) => (
                <tr key={p._id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <Link className="text-[var(--accent)] hover:underline" to={`/projects/${p._id}`}>{p.name}</Link>
                  </td>
                  <td className="px-4 py-3">{p.type}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3 mono text-xs">{p.subdomain || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-6 text-[var(--muted)]">No projects</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
