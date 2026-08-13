import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { EmptyState, PageHeader, StatusBadge } from '../components/ui'

export default function UsersPage() {
  const { can } = useAuth()
  const canWrite = can('users:write')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [data, setData] = useState({ users: [] })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users', { params: { q, status: status || undefined, page: 1, limit: 100 } })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={
          canWrite
            ? 'Search accounts, inspect sessions, suspend or permanently delete.'
            : 'Browse user accounts and details (read-only).'
        }
        actions={
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              load()
            }}
          >
            <input className="input min-w-[220px]" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / email / github" />
            <select className="select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="suspend">suspend</option>
            </select>
            <button className="btn btn-primary">Search</button>
          </form>
        }
      />

      <div className="table-wrap card !shadow-none overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Network</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-[var(--muted)]">Loading…</td></tr>
            ) : data.users?.length ? data.users.map((u) => (
              <tr key={u._id}>
                <td>
                  <Link to={`/users/${u._id}`} className="font-medium text-[#7ddeb0] hover:underline">
                    {u.fullName}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">{u.email}</div>
                </td>
                <td><StatusBadge value={u.status} /></td>
                <td>{u.provider}</td>
                <td className="mono text-xs text-[var(--muted)]">{u.networkName}</td>
                <td className="text-[var(--muted)] text-xs">{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            )) : (
              <tr><td colSpan={5}><EmptyState title="No users found" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-[var(--muted)] mt-3 flex gap-4">
        <span>Total: {data.pagination?.total ?? data.users?.length ?? 0}</span>
        {data.cached ? <span>Served from 1h cache</span> : null}
      </div>
    </div>
  )
}
