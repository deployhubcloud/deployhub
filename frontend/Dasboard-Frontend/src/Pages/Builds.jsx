import { useEffect, useState } from 'react'
import { api } from '../api/apiclient'

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

const DOT = { success: 'bg-emerald-500', failed: 'bg-red-500', building: 'bg-amber-400', queued: 'bg-zinc-500' }
const ST = { success: 'text-emerald-400', failed: 'text-red-400', building: 'text-amber-400', queued: 'text-zinc-500' }

function BuildCard({ b }) {
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
    <div className="rounded-xl border border-white/[0.08] bg-zinc-900 overflow-hidden hover:border-white/[0.14] transition-colors">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={toggleLogs}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT[status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium text-zinc-100">{b.projectName}</span>
            <span className="font-mono text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {shortSha(b.commitSha)}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-zinc-500">
            <span>{ago(b.createdAt)}</span>
            <span>{dur(b.startedAt, b.finishedAt)}</span>
            <span>ID: {b.projectId?.slice(-8)}</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); toggleLogs() }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${open
              ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
              : 'border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Logs
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <span className={`text-sm font-medium flex-shrink-0 ${ST[status]}`}>
          {b.buildStaus ?? b.buildStatus ?? 'queued'}
        </span>
      </div>

      {/* Log Panel */}
      {open && (
        <div className="border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-5 py-2.5 bg-black/40 border-b border-white/[0.05]">
            <span className="text-[11px] text-zinc-600 font-mono uppercase tracking-wider">build output</span>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(logs ?? '')}
                className="text-[11px] text-zinc-500 border border-white/[0.08] hover:text-zinc-200 hover:border-white/20 px-2.5 py-1 rounded-md transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => window.open(b.logsUrl?.trim(), '_blank')}
                className="text-[11px] text-zinc-500 border border-white/[0.08] hover:text-zinc-200 hover:border-white/20 px-2.5 py-1 rounded-md transition-colors"
              >
                Raw ↗
              </button>
            </div>
          </div>
          <div className="bg-[#0c0c0d] px-5 py-4 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto">
            {logsErr && <span className="text-red-400">Could not load logs: {logsErr}</span>}
            {!logs && !logsErr && <span className="text-zinc-600">Fetching logs…</span>}
            {lines.map((line, i) => (
              <div key={i}>
                <span className="text-zinc-700 select-none mr-3 inline-block w-6 text-right">{i + 1}</span>
                <span className={
                  /error|failed|exception|fatal/i.test(line) ? 'text-red-400' :
                    /warn/i.test(line) ? 'text-amber-400' :
                      /success|done|complete/i.test(line) ? 'text-emerald-400' :
                        /^\s*(step|run|fetch|pull|build|install)/i.test(line) ? 'text-blue-400' :
                          'text-zinc-400'
                }>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

  if (loading) return <p className="p-6 text-zinc-400 text-sm">Loading...</p>
  if (error) return <p className="p-6 text-red-400 text-sm">{error}</p>

  const validBuilds = builds.filter(b => b.projectName)

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
        <span className="text-sm text-zinc-500">{validBuilds.length} builds</span>
      </div>
      <div className="flex flex-col gap-3">
        {validBuilds.map((b, i) => <BuildCard key={i} b={b} />)}
      </div>
    </div>
  )
}

export default Builds