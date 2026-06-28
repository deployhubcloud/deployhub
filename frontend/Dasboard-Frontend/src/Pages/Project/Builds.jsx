import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/apiclient'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Skeleton from '../../components/ui/Skeleton'

function timeAgo(d) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  if (h < 24) return h + 'h ago'
  return dy + 'd ago'
}

function calcDur(s, e) {
  if (!s || !e) return '—'
  const sec = Math.floor((new Date(e) - new Date(s)) / 1000)
  return sec < 60 ? sec + 's' : Math.floor(sec / 60) + 'm ' + (sec % 60) + 's'
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <tr key={i} className="border-b border-white/[0.06]">
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-6" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-5 w-20" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-16" /></td>
          <td className="py-3.5 px-4 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
          <td className="py-3.5 px-4 hidden md:table-cell"><Skeleton className="h-4 w-10" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-14" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-7 w-16 ml-auto" /></td>
        </tr>
      ))}
    </>
  )
}

function Builds() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const [builds, setBuilds] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/build' + '/builds/' + projectId)
      .then(r => { setBuilds(r.data.data || []); setTotal(r.data.data.length || 0) })
      .catch(() => setError('Failed to load builds.'))
      .finally(() => setLoading(false))
  }, [projectId])

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader section="Project" title="Builds" />

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-neutral-500 mb-4">{total} total build{total !== 1 ? 's' : ''}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="py-3 px-4 font-medium">#</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Commit</th>
              <th className="py-3 px-4 font-medium hidden sm:table-cell">Branch</th>
              <th className="py-3 px-4 font-medium hidden md:table-cell">Duration</th>
              <th className="py-3 px-4 font-medium">Time</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : builds.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-neutral-500">
                  No builds yet. Push to your repo to trigger the first build.
                </td>
              </tr>
            ) : builds.map((build, i) => {
              const num = total - i
              const dur = calcDur(build.startedAt, build.finishedAt)
              return (
                <tr key={build._id} className="group border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 text-neutral-400 tabular-nums">{num}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={build.status} />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">
                    {build.commitSha?.slice(0, 7) || '—'}
                  </td>
                  <td className="py-3.5 px-4 hidden sm:table-cell text-neutral-500">
                    {build.branch || 'main'}
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell font-mono text-xs text-neutral-500">
                    {dur}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-500 text-xs">
                    {timeAgo(build.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {build.logsUrl ? (
                      <button
                        onClick={() => navigate('/project/' + projectId + '/logs/' + build._id)}
                        className="opacity-0 group-hover:opacity-100 text-xs font-medium px-2.5 py-1 rounded-md border border-white/10 text-neutral-300 hover:bg-white/5 transition-all"
                      >
                        View Logs
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-700">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { Builds }
