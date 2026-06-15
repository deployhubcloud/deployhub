import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/apiclient'
import { useProjectsStatus } from '../hooks/useProjectsStatus'

const STATUS = {
  queued: { text: 'Queued', color: '#eab308', pulse: false },
  building: { text: 'Building', color: '#38bdf8', pulse: true },
  running: { text: 'Live', color: '#22c55e', pulse: true },
  failed: { text: 'Failed', color: '#ef4444', pulse: false },
  stopped: { text: 'Stopped', color: '#6b7280', pulse: false },
}

const TYPES = [
  { key: 'static', title: 'Static Site', desc: 'Vite, React, Vue, Astro, docs, portfolios, and marketing sites.', plan: 'Free', color: '#22d3ee', icon: 'M3 5h18M5 5v14h14V5M8 9h8M8 13h5' },
  { key: 'node', title: 'Node.js App', desc: 'Express, APIs, workers, dashboards, and long-running services.', plan: 'Starter', color: '#22c55e', icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5l-8 4.5-8-4.5' },
  { key: 'go', title: 'Go Service', desc: 'Fast HTTP services, background jobs, and small binaries.', plan: 'Starter', color: '#60a5fa', icon: 'M4 7h10a5 5 0 010 10H4m3-5h11M4 10h3m-3 4h3' },
  { key: 'python', title: 'Python App', desc: 'FastAPI, Flask, automation services, and ML-backed APIs.', plan: 'Starter', color: '#fbbf24', icon: 'M12 4h4a4 4 0 014 4v2h-8a4 4 0 00-4 4v6H8a4 4 0 01-4-4v-4a4 4 0 014-4h8m-4 12H8a4 4 0 01-4-4v-2h8a4 4 0 004-4V4h4a4 4 0 014 4v4a4 4 0 01-4 4h-8' },
  { key: 'java', title: 'Java Service', desc: 'Spring Boot and JVM services with Pro resources.', plan: 'Pro', color: '#a78bfa', icon: 'M8 18h8M10 14h4m-5-3h6a3 3 0 000-6H9v13m3-13v13' },
]

function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function getDisplayUrl(project) {
  if (project.isMicroservice && project.internalUrl) return project.internalUrl
  if (Array.isArray(project.domain)) return project.domain[0]
  return project.domain
}

const TYPE_GLYPH = { node: 'N', static: 'S', go: 'Go', python: 'Py', java: 'Jv' }
const TYPE_LABEL = { node: 'Node.js', static: 'Static', go: 'Go', python: 'Python', java: 'Java' }

// ── useVisibleProjects ────────────────────────────────────────────────────
function useVisibleProjects(projects) {
  const [visibleIds, setVisibleIds] = useState([])
  const rowRefs = useRef({})

  useEffect(() => {
    if (projects.length === 0) {
      setVisibleIds([])
      return
    }

    setVisibleIds([])

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds(prev => {
          const updated = new Set(prev)
          entries.forEach(entry => {
            const id = entry.target.dataset.projectId
            if (entry.isIntersecting) updated.add(id)
            else updated.delete(id)
          })
          return [...updated]
        })
      },
      { threshold: 0.1 }
    )

    Object.entries(rowRefs.current).forEach(([, el]) => {
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
      setVisibleIds([])
    }
  }, [projects])

  return { visibleIds, rowRefs }
}

// ── StatusDot ─────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const s = STATUS[status] || STATUS.stopped
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color: s.color }}>
      <span className="relative inline-flex">
        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
        {s.pulse && (
          <span className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
            style={{ background: s.color, opacity: 0.6 }} />
        )}
      </span>
      {s.text}
    </span>
  )
}

// ── ProjectRow ────────────────────────────────────────────────────────────
function ProjectRow({ project, rowRef }) {
  const navigate = useNavigate()
  const displayUrl = getDisplayUrl(project)
  const isInternal = project.isMicroservice && project.internalUrl
  const showVersion = project.type !== 'static' && project.version
  const s = STATUS[project.status] || STATUS.stopped
  const notif = project.notification || {}
  const notifCount = (notif.discord ? 1 : 0) + (notif.telegram ? 1 : 0) + (notif.email ? 1 : 0)

  return (
    <div
      ref={rowRef}
      data-project-id={project._id}
      onClick={e => {
        if (e.target.closest('button') || e.target.closest('a')) return
        navigate(`/project/${project._id}`)
      }}
      className="group relative grid grid-cols-12 items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="absolute left-0 top-0 h-full w-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: s.color }} />

      {/* Identity */}
      <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg grid place-items-center text-[13px] font-semibold tracking-tight flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e5e7eb' }}>
          {TYPE_GLYPH[project.type] || project.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-white text-[14px] truncate">{project.name}</span>
            {project.plan === 'pro' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>Pro</span>
            )}
            {project.isMicroservice && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>μSVC</span>
            )}
          </div>
          {isInternal ? (
            <span className="text-[12px] truncate block mt-0.5" style={{ color: '#6b7280' }}>
              {displayUrl} · internal
            </span>
          ) : (
            <a href={`https://${displayUrl}`} target="_blank" rel="noreferrer"
              className="text-[12px] truncate block mt-0.5 transition-colors"
              style={{ color: '#6b7280' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e5e7eb')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
              {displayUrl}
            </a>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="hidden md:flex md:col-span-2 items-center gap-2 text-[12px]" style={{ color: '#9ca3af' }}>
        <span>{TYPE_LABEL[project.type] || project.type}</span>
        {showVersion && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#9ca3af' }}>
            v{project.version}
          </span>
        )}
      </div>

      {/* Builds */}
      <div className="hidden md:block md:col-span-1 text-[13px] font-medium tabular-nums" style={{ color: '#d1d5db' }}>
        {project.totalBuilds ?? 0}
        <span className="ml-1 text-[10px] uppercase tracking-wider" style={{ color: '#4b5563' }}>blds</span>
      </div>

      {/* Signals */}
      <div className="hidden md:flex md:col-span-2 items-center gap-3 text-[11px]" style={{ color: '#6b7280' }}>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifCount}/3
        </span>
        <span className="inline-flex items-center gap-1.5"
          style={{ color: project.monitorEnabled ? '#22c55e' : '#6b7280' }}>
          <span className="w-1.5 h-1.5 rounded-full"
            style={{ background: project.monitorEnabled ? '#22c55e' : '#4b5563' }} />
          {project.monitorEnabled ? 'Monitor' : 'Off'}
        </span>
      </div>

      {/* Status */}
      <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-4">
        <StatusDot status={project.status} />
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-[11px]" style={{ color: '#4b5563' }}>
            {timeAgo(project.updatedAt)}
          </span>
          <Link
            to={`/project/${project._id}`}
            onClick={e => e.stopPropagation()}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
            style={{ color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 items-center gap-4 px-5 py-4 animate-pulse"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded w-32" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-2 rounded w-48" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>
      <div className="col-span-2 h-2.5 rounded w-16" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="col-span-1 h-2.5 rounded w-8" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="col-span-2 h-2.5 rounded w-20" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="col-span-2 h-2.5 rounded w-16 justify-self-end" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl grid place-items-center mb-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <svg className="w-7 h-7" style={{ color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="font-semibold text-lg text-white mb-1.5">Nothing deployed yet</h3>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Ship your first project in under a minute.</p>
      <button onClick={onNew}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-black transition-transform hover:scale-[1.02]"
        style={{ background: '#22d3ee' }}>
        <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
        New Deployment
      </button>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────
function NewDeployModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: '#0b0f15', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <h2 className="text-base font-semibold text-white">New deployment</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Pick a runtime to get started</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5" style={{ color: '#9ca3af' }}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 max-h-[65vh] overflow-y-auto">
          {TYPES.map(type => (
            <Link key={type.key} to={`/projects/new/${type.key}`} onClick={onClose}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ color: type.color, background: `${type.color}12`, border: `1px solid ${type.color}25` }}>
                <Icon path={type.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-sm">{type.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: type.plan === 'Pro' ? '#22d3ee' : '#6b7280' }}>
                    {type.plan}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#6b7280' }}>{type.desc}</p>
              </div>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#4b5563' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/project/projects')
      .then(res => setProjects(res.data?.projects || []))
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [])

  // Status update handler
  const handleStatusUpdate = useCallback((projectId, status) => {
    setProjects(prev =>
      prev.map(p => p._id === projectId ? { ...p, status } : p)
    )
  }, [])

  const counts = useMemo(() => ({
    all: projects.length,
    running: projects.filter(p => p.status === 'running').length,
    stopped: projects.filter(p => p.status === 'stopped').length,
    building: projects.filter(p => p.status === 'building').length,
    queued: projects.filter(p => p.status === 'queued').length,
    failed: projects.filter(p => p.status === 'failed').length,
  }), [projects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects
      .filter(p => filter === 'all' || p.status === filter)
      .filter(p => !q || p.name.toLowerCase().includes(q) || (getDisplayUrl(p) || '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'builds') return (b.totalBuilds ?? 0) - (a.totalBuilds ?? 0)
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [projects, filter, sort, query])

  // Visible projects track + WS subscribe
  const { visibleIds, rowRefs } = useVisibleProjects(filtered)
  useProjectsStatus(visibleIds, handleStatusUpdate)

  const FILTERS = [
    { k: 'all', l: 'All', c: counts.all, color: '#9ca3af' },
    { k: 'running', l: 'Live', c: counts.running, color: '#22c55e' },
    { k: 'building', l: 'Building', c: counts.building, color: '#38bdf8' },
    { k: 'queued', l: 'Queued', c: counts.queued, color: '#eab308' },
    { k: 'failed', l: 'Failed', c: counts.failed, color: '#ef4444' },
    { k: 'stopped', l: 'Stopped', c: counts.stopped, color: '#6b7280' },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="space-y-6 px-1">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap pt-2">
        <div>
          {!loading && (
            <p className="text-[13px] mt-1" style={{ color: '#6b7280' }}>
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              {counts.running > 0 && <> · <span style={{ color: '#22c55e' }}>{counts.running} live</span></>}
              {counts.building > 0 && <> · <span style={{ color: '#38bdf8' }}>{counts.building} building</span></>}
              {counts.failed > 0 && <> · <span style={{ color: '#ef4444' }}>{counts.failed} failed</span></>}
            </p>
          )}
        </div>
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm text-black transition-transform hover:scale-[1.02] active:scale-95"
          style={{ background: '#22d3ee' }}>
          <Icon path="M12 4v16m8-8H4" className="h-4 w-4" />
          New Deployment
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm"
          style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Controls */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search projects or domains…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#e5e7eb' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#d1d5db' }}>
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="builds">Most builds</option>
          </select>
        </div>
      )}

      {/* Filter chips */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(t => {
            const active = filter === t.k
            return (
              <button key={t.k} onClick={() => setFilter(t.k)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={active
                  ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }
                  : { background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af' }
                }>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                {t.l}
                <span className="tabular-nums" style={{ color: active ? '#9ca3af' : '#4b5563' }}>{t.c}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* List */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {!loading && filtered.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: '#4b5563', background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-5">Project</div>
            <div className="col-span-2">Runtime</div>
            <div className="col-span-1">Builds</div>
            <div className="col-span-2">Signals</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
        )}

        {loading ? (
          <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
        ) : filtered.length === 0 ? (
          projects.length === 0
            ? <EmptyState onNew={() => setModalOpen(true)} />
            : <div className="py-16 text-center text-sm" style={{ color: '#6b7280' }}>No projects match your filters.</div>
        ) : (
          filtered.map(p => (
            <ProjectRow
              key={p._id}
              project={p}
              rowRef={el => { rowRefs.current[p._id] = el }}
            />
          ))
        )}
      </div>

      {modalOpen && <NewDeployModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

export default Projects