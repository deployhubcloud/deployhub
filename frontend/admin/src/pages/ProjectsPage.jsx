import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'

export default function ProjectsPage() {
  const [q, setQ] = useState('')
  const [data, setData] = useState({ projects: [] })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/projects', { params: { q, page: 1, limit: 50 } })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects')
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
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-[var(--muted)] mt-1">Inspect domains, status, and ownership.</p>
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
            placeholder="Search name / subdomain / domain"
            className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 min-w-[260px]"
          />
          <button className="rounded-lg bg-[var(--accent)] text-black px-4 font-medium">Search</button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--panel-2)] text-[var(--muted)] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Subdomain</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-[var(--muted)]" colSpan={5}>Loading…</td></tr>
            ) : data.projects?.length ? (
              data.projects.map((p) => (
                <tr key={p._id} className="border-t border-[var(--line)] hover:bg-[var(--panel-2)]/50">
                  <td className="px-4 py-3">
                    <Link className="text-[var(--accent)] hover:underline" to={`/projects/${p._id}`}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.type}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">{p.plan}</td>
                  <td className="px-4 py-3 mono text-xs">{p.subdomain || '—'}</td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-6 text-[var(--muted)]" colSpan={5}>No projects found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
