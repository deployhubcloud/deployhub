import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Cpu, HardDrive, Play, RefreshCw, Square, RotateCcw } from 'lucide-react'
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
          units: (prev.units || []).map((u) => (u.id === unit.id ? res.data.unit : u)),
        }
      })
      setTimeout(() => load(true), 1200)
    } catch (err) {
      toast.error(err.response?.data?.message || `${verb} failed`)
    } finally {
      setBusyId('')
    }
  }

  const host = data?.host
  const summary = data?.summary
  const unitsByGroup = useMemo(() => {
    const map = { edge: [], backend: [], frontend: [] }
    for (const u of data?.units || []) {
      if (map[u.group]) map[u.group].push(u)
      else map.backend.push(u)
    }
    return map
  }, [data])

  return (
    <div>
      <PageHeader
        title="Infrastructure"
        subtitle="Docker fleet for DeployHub — start, stop, and live usage. Host processes are listed separately."
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

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Running" value={loading ? '—' : summary?.running} hint={`${summary?.total || 0} managed units`} />
        <StatCard label="Stopped" value={loading ? '—' : summary?.stopped} hint={`${summary?.missing || 0} missing`} />
        <StatCard
          label="Host CPUs"
          value={loading ? '—' : host?.cpus ?? '—'}
          hint={host?.dockerVersion ? `Docker ${host.dockerVersion}` : 'Docker host'}
        />
        <StatCard
          label="Host memory"
          value={loading ? '—' : host?.memory ? formatBytes(host.memory) : '—'}
          hint={host?.os || ''}
        />
      </div>

      {GROUPS.map((group) => (
        <section key={group.id} className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] mb-3">{group.title}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Status</th>
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
                          {unit.health ? <StatusBadge value={unit.health} /> : null}
                          {unit.self ? <span className="badge badge-gray">this api</span> : null}
                          {unit.critical ? <span className="badge badge-amber">critical</span> : null}
                        </div>
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
                          {unit.self ? (
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
    </div>
  )
}
