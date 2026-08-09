import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [data, setData] = useState({ users: [], pagination: null })
  const [loading, setLoading] = useState(true)

  const load = async (query = q) => {
    setLoading(true)
    try {
      const res = await api.get('/users', { params: { q: query, page: 1, limit: 50 } })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Users</h1>
          <p className="text-[var(--muted)] mt-1">Search and manage platform accounts.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            load()
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email / name"
            className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 min-w-[240px]"
          />
          <button className="rounded-lg bg-[var(--accent)] text-black px-4 font-medium">Search</button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--panel-2)] text-[var(--muted)] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Provider</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-[var(--muted)]" colSpan={4}>Loading…</td></tr>
            ) : data.users?.length ? (
              data.users.map((u) => (
                <tr key={u._id} className="border-t border-[var(--line)] hover:bg-[var(--panel-2)]/50">
                  <td className="px-4 py-3">
                    <Link className="text-[var(--accent)] hover:underline" to={`/users/${u._id}`}>
                      {u.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.status}</td>
                  <td className="px-4 py-3">{u.provider}</td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-6 text-[var(--muted)]" colSpan={4}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {data.cached && (
        <p className="text-xs text-[var(--muted)] mt-2">Served from cache (1h)</p>
      )}
    </div>
  )
}
