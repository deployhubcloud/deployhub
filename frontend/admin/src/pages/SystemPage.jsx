import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Cpu,
  HardDrive,
  Play,
  RefreshCw,
  Square,
  RotateCcw,
  ScrollText,
  Download,
  Activity,
} from 'lucide-react'
import { api } from '../api/client'
import { PageHeader, StatCard, StatusBadge } from '../components/ui'

function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let x = v / 1024
  let i = 0
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024
    i += 1
  }
  return `${x.toFixed(x >= 10 ? 0 : 1)} ${units[i]}`
}

function formatAge(iso) {
  if (!iso || iso.startsWith('0001')) return '—'
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return '—'
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`
}

function Sparkline({ values, color = '#2f9e6c' }) {
  const pts = (values || []).map((n) => Math.max(0, Number(n) || 0))
  if (pts.length < 2) {
    return <div className="h-8 w-[120px] rounded bg-[var(--panel-3)]" />
  }
  const w = 120
  const h = 32
  const max = Math.max(...pts, 1)
  const d = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w
      const y = h - 2 - (p / max) * (h - 4)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

function UsageBar({ value, tone = 'green' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const color =
    pct >= 85 ? 'bg-[#d45454]' : pct >= 65 ? 'bg-[#c9a227]' : tone === 'blue' ? 'bg-[#4d8fd6]' : 'bg-[var(--accent)]'
  return (
    <div className="min-w-[88px]">
      <div className="flex justify-between text-[11px] text-[var(--muted)] mb-1 tabular-nums">
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--panel-3)] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const GROUPS = [
  { id: 'edge', title: 'Edge' },
  { id: 'backend', title: 'Backend services' },
  { id: 'frontend', title: 'Frontends' },
]

export default function SystemPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [auto, setAuto] = useState(true)
  const [logUnit, setLogUnit] = useState(null)
  const [logText, setLogText] = useState('')
  const [logFilter, setLogFilter] = useState('')
  const [logBusy, setLogBusy] = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const res = await api.get('/system')
      setData(res.data)
    } catch (err) {
      if (!quiet) toast.error(err.response?.data?.message || 'Failed to load infrastructure')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!auto) return undefined
    const id = setInterval(() => load(true), 8000)
    return () => clearInterval(id)
  }, [auto, load])

  const act = async (unit, action) => {
    const verb = action === 'stop' ? 'Stop' : action === 'restart' ? 'Restart' : 'Start'
    const warn = unit.critical
      ? `\n\nThis unit is on the critical path. ${action === 'stop' ? 'Stopping it can take the platform offline.' : 'Restarting may briefly interrupt traffic.'}`
      : ''
    if (!window.confirm(`${verb} ${unit.label}?${warn}`)) return

    setBusyId(unit.id)
    try {
      const res = await api.post(`/system/${unit.id}/${action}`)
      const done = { start: 'started', stop: 'stopped', restart: 'restarted' }[action]
      toast.success(`${unit.label} ${done}`)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          units: (prev.units || []).map((u) => (u.id === unit.id ? { ...u, ...res.data.unit } : u)),
        }
      })
      setTimeout(() => load(true), 1200)
    } catch (err) {
      toast.error(err.response?.data?.message || `${verb} failed`)
    } finally {
      setBusyId('')
    }
  }

  const openLogs = async (unit) => {
    setLogUnit(unit)
    setLogFilter('')
    setLogBusy(true)
    setLogText('')
    try {
      const res = await api.get(`/system/${unit.id}/logs`, { params: { tail: 400 } })
      setLogText(res.data.text || '')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load logs')
      setLogText('')
    } finally {
      setLogBusy(false)
    }
  }

  const filteredLogs = useMemo(() => {
    const q = logFilter.trim().toLowerCase()
    if (!q) return logText
    return logText
      .split('\n')
      .filter((line) => line.toLowerCase().includes(q))
      .join('\n')
  }, [logText, logFilter])

  const downloadLogs = () => {
    const blob = new Blob([filteredLogs || logText || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${logUnit?.id || 'container'}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  const host = data?.host
  const summary = data?.summary
  const disk = data?.disk
  const events = data?.events || []
  const unitsByGroup = useMemo(() => {
    const map = { edge: [], backend: [], frontend: [] }
    for (const u of data?.units || []) {
      if (map[u.group]) map[u.group].push(u)
      else map.backend.push(u)
    }
    return map
  }, [data])

  const graphUnits = (data?.units || []).filter((u) => (u.history || []).length > 1)

  return (
    <div>
      <PageHeader
        title="Infrastructure"
        subtitle="Live Docker fleet — health probes, 15-minute CPU/RAM, logs, and events."
        actions={
          <>
            <label className="btn btn-ghost text-sm">
              <input
                type="checkbox"
                className="accent-[var(--accent)]"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Live refresh
            </label>
            <button type="button" className="btn btn-ghost" onClick={() => load()} disabled={loading}>
              <RefreshCw size={14} /> Refresh
            </button>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Running" value={loading ? '—' : summary?.running} hint={`${summary?.total || 0} managed units`} />
        <StatCard label="Stopped" value={loading ? '—' : summary?.stopped} hint={`${summary?.missing || 0} missing`} />
        <StatCard
          label="Unhealthy"
          value={loading ? '—' : summary?.unhealthy}
          hint="HTTP probe failures"
        />
        <StatCard
          label="Host CPUs"
          value={loading ? '—' : host?.cpus ?? '—'}
          hint={host?.dockerVersion ? `Docker ${host.dockerVersion}` : 'Docker host'}
        />
        <StatCard
          label="Host memory"
          value={loading ? '—' : host?.memory ? formatBytes(host.memory) : '—'}
          hint={disk ? `images ${formatBytes(disk.layersSize)}` : host?.os || ''}
        />
      </div>

      {graphUnits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] mb-3">
            Last 15 minutes
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {graphUnits.map((unit) => (
              <div key={unit.id} className="card p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="font-medium text-sm">{unit.label}</div>
                  <span className="text-[11px] text-[var(--muted)] tabular-nums">
                    CPU {unit.usage?.cpuPercent?.toFixed?.(1) ?? '—'}%
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">CPU</div>
                    <Sparkline values={unit.history.map((h) => h.cpuPercent)} color="#2f9e6c" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Memory</div>
                    <Sparkline values={unit.history.map((h) => h.memPercent)} color="#4d8fd6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Graphs fill after the sampler has run (~10s). High CPU/RAM and failed health send email to the super-admin inbox (30 min cooldown).
          </p>
        </section>
      )}

      {GROUPS.map((group) => (
        <section key={group.id} className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] mb-3">{group.title}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Probe</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Uptime</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(unitsByGroup[group.id] || []).map((unit) => {
                  const busy = busyId === unit.id
                  return (
                    <tr key={unit.id}>
                      <td>
                        <div className="font-medium">{unit.label}</div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{unit.description}</div>
                        <div className="text-[11px] text-[var(--muted)] mono mt-1">{unit.name}</div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge value={unit.status} />
                          {unit.dockerHealth ? <StatusBadge value={unit.dockerHealth} /> : null}
                          {unit.self ? <span className="badge badge-gray">this api</span> : null}
                          {unit.locked && !unit.self ? <span className="badge badge-gray">protected</span> : null}
                          {unit.critical ? <span className="badge badge-amber">critical</span> : null}
                          {unit.restartCount > 0 ? (
                            <span className="badge badge-gray">{unit.restartCount} restarts</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {unit.probe ? (
                          <div>
                            <StatusBadge value={unit.probe.ok ? 'healthy' : 'unhealthy'} />
                            <div className="text-[11px] text-[var(--muted)] mt-1 tabular-nums">
                              {unit.probe.ms}ms
                              {unit.probe.status ? ` · ${unit.probe.status}` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td>
                        {unit.running && unit.usage ? (
                          <div className="flex items-center gap-2">
                            <Cpu size={13} className="text-[var(--muted)]" />
                            <UsageBar value={unit.usage.cpuPercent} />
                          </div>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td>
                        {unit.running && unit.usage?.memory ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <HardDrive size={13} className="text-[var(--muted)]" />
                              <UsageBar value={unit.usage.memory.percent} tone="blue" />
                            </div>
                            <div className="text-[11px] text-[var(--muted)] mt-1 tabular-nums">
                              {formatBytes(unit.usage.memory.used)} / {formatBytes(unit.usage.memory.limit)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="text-sm text-[var(--muted)] tabular-nums">{formatAge(unit.startedAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          {unit.present && (
                            <button
                              type="button"
                              className="btn btn-ghost py-1.5 px-2.5 text-xs"
                              onClick={() => openLogs(unit)}
                            >
                              <ScrollText size={12} /> Logs
                            </button>
                          )}
                          {unit.canStart && (
                            <button
                              type="button"
                              className="btn btn-primary py-1.5 px-2.5 text-xs"
                              disabled={busy}
                              onClick={() => act(unit, 'start')}
                            >
                              <Play size={12} /> Start
                            </button>
                          )}
                          {unit.canRestart && (
                            <button
                              type="button"
                              className="btn btn-ghost py-1.5 px-2.5 text-xs"
                              disabled={busy}
                              onClick={() => act(unit, 'restart')}
                            >
                              <RotateCcw size={12} /> Restart
                            </button>
                          )}
                          {unit.canStop && (
                            <button
                              type="button"
                              className="btn btn-danger py-1.5 px-2.5 text-xs"
                              disabled={busy}
                              onClick={() => act(unit, 'stop')}
                            >
                              <Square size={12} /> Stop
                            </button>
                          )}
                          {unit.locked ? (
                            <span className="text-[11px] text-[var(--muted)]">protected</span>
                          ) : null}
                          {!unit.present ? (
                            <span className="text-[11px] text-[var(--muted)]">not deployed</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] mb-3">
          Docker events
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Unit</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-[var(--muted)]">
                    No recent platform container events.
                  </td>
                </tr>
              ) : (
                events.map((ev, i) => (
                  <tr key={`${ev.ts}-${ev.id}-${i}`}>
                    <td className="text-sm text-[var(--muted)] tabular-nums">
                      {ev.ts ? new Date(ev.ts).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div>{ev.label}</div>
                      <div className="text-[11px] mono text-[var(--muted)]">{ev.name}</div>
                    </td>
                    <td>
                      <StatusBadge value={ev.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 card p-5">
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] mb-3">Not in Docker</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          These run on the host and are not managed here.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(data?.excluded || []).map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-4">
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{item.note}</div>
            </div>
          ))}
        </div>
      </section>

      {logUnit && (
        <div className="fixed inset-0 z-50 bg-black/55 grid place-items-center p-4" onClick={() => setLogUnit(null)}>
          <div
            className="card w-full max-w-4xl max-h-[85vh] flex flex-col p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-semibold">{logUnit.label} logs</div>
                <div className="text-xs text-[var(--muted)] mono">{logUnit.name}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost text-xs" onClick={() => openLogs(logUnit)} disabled={logBusy}>
                  <Activity size={12} /> Reload
                </button>
                <button type="button" className="btn btn-ghost text-xs" onClick={downloadLogs} disabled={!logText}>
                  <Download size={12} /> Download
                </button>
                <button type="button" className="btn btn-ghost text-xs" onClick={() => setLogUnit(null)}>
                  Close
                </button>
              </div>
            </div>
            <input
              className="input mb-3"
              placeholder="Filter lines…"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
            />
            <pre className="flex-1 overflow-auto rounded-xl bg-[#0a0e0c] border border-[var(--line)] p-3 text-[12px] leading-relaxed text-[#c5d4cb] min-h-[240px] whitespace-pre-wrap">
              {logBusy ? 'Loading…' : filteredLogs || 'No log output'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
