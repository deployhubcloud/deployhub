import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { EmptyState, PageHeader, StatusBadge } from '../components/ui'

export default function AuditLogsPage() {
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [data, setData] = useState({ logs: [], pagination: {} })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/audit-logs', {
        params: {
          actor: actor || undefined,
          action: action || undefined,
          page: 1,
          limit: 100,
        },
      })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Every action taken by normal admins — login activity, user views, and blocked attempts."
        actions={
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              load()
            }}
          >
            <input
              className="input min-w-[160px]"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Actor username"
            />
            <input
              className="input min-w-[180px]"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Action / path"
            />
            <button className="btn btn-primary">Filter</button>
          </form>
        }
      />

      <div className="table-wrap card !shadow-none overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Status</th>
              <th>Target</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : data.logs?.length ? (
              data.logs.map((log) => (
                <tr key={log._id}>
                  <td className="text-xs text-[var(--muted)] whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <div className="font-medium mono text-sm">{log.actorUsername}</div>
                    <div className="text-xs text-[var(--muted)]">{log.actorRole}</div>
                  </td>
                  <td className="mono text-xs">{log.action}</td>
                  <td>
                    <StatusBadge
                      value={
                        log.statusCode >= 400
                          ? 'failed'
                          : log.statusCode >= 200
                            ? 'success'
                            : 'pending'
                      }
                    />
                    <div className="text-[11px] text-[var(--muted)] mt-1">{log.statusCode}</div>
                  </td>
                  <td className="text-xs text-[var(--muted)]">
                    {log.targetType ? `${log.targetType}:${log.targetId}` : '—'}
                  </td>
                  <td className="mono text-xs text-[var(--muted)]">{log.ip || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No audit logs yet" text="Normal admin activity will appear here." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
