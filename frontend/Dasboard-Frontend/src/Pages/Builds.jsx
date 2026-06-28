import { useEffect, useState } from 'react'
import { api } from '../api/apiclient'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import Skeleton from '../components/ui/Skeleton'

function shortSha(s) { return s?.slice(0, 7) ?? '—' }

function dur(a, b) {
  if (!a || !b) return '—'
  const s = Math.round((new Date(b) - new Date(a)) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

function ago(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function sc(s = '') {
  s = s.toLowerCase()
  if (s === 'success') return 'success'
  if (s === 'failed' || s === 'failure') return 'failed'
  if (s === 'building' || s === 'running') return 'building'
  return 'queued'
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <tr key={i} className="border-b border-white/[0.06]">
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-5 w-20" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-16" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-10" /></td>
          <td className="py-3.5 px-4"><Skeleton className="h-4 w-14" /></td>
        </tr>
      ))}
    </>
  )
}

function BuildRow({ b }) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState(null)
  const [logsErr, setLogsErr] = useState(null)
  const status = sc(b.buildStaus ?? b.buildStatus)

  const toggleLogs = async () => {
    setOpen(o => !o)
    if (!logs && !logsErr && b.logsUrl) {
      try {
        const res = await fetch(b.logsUrl.trim())
        if (!res.ok) throw new Error('HTTP ' + res.status)
        setLogs(await res.text())
      } catch (e) {
        setLogsErr(e.message)
      }
    }
  }

  const lines = logs?.split('\n').filter(l => l.trim()) ?? []

  return (
    <>
      <tr className="group border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
        <td className="py-3.5 px-4 font-medium text-white">{b.projectName}</td>
        <td className="py-3.5 px-4"><StatusBadge status={status} /></td>
        <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">{shortSha(b.commitSha)}</td>
        <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">{dur(b.startedAt, b.finishedAt)}</td>
        <td className="py-3.5 px-4 text-xs text-neutral-500">{ago(b.createdAt)}</td>
        <td className="py-3.5 px-4 text-right">
          {b.logsUrl && (
            <button
              onClick={toggleLogs}
              className="opacity-0 group-hover:opacity-100 text-xs font-medium px-2.5 py-1 rounded-md border border-white/10 text-neutral-300 hover:bg-white/5 transition-all"
            >
              {open ? 'Hide Logs' : 'View Logs'}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="p-0 border-b border-white/[0.06]">
            <div className="bg-[#0d0d0d] px-5 py-4 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto">
              {logsErr && <span className="text-red-400">Could not load logs: {logsErr}</span>}
              {!logs && !logsErr && <span className="text-neutral-600">Fetching logs…</span>}
              {lines.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-neutral-700 select-none w-6 text-right">{i + 1}</span>
                  <span className={
                    /error|failed|exception|fatal/i.test(line) ? 'text-red-400' :
                    /warn/i.test(line) ? 'text-amber-400' :
                    /success|done|complete/i.test(line) ? 'text-green-400' :
                    'text-neutral-400'
                  }>{line}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function Builds() {
  const [builds, setBuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/build/builds')
      .then(res => setBuilds(res.data.builds ?? res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const validBuilds = builds.filter(b => b.projectName)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader section="Workspace" title="Builds" />

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-neutral-500 mb-4">{validBuilds.length} builds</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Commit</th>
              <th className="py-3 px-4 font-medium">Duration</th>
              <th className="py-3 px-4 font-medium">Time</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : validBuilds.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-neutral-500">No builds found.</td>
              </tr>
            ) : (
              validBuilds.map((b, i) => <BuildRow key={i} b={b} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Builds
