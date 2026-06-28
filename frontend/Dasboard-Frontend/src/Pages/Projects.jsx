import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/apiclient'
import { useProjectsStatus } from '../hooks/useProjectsStatus'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import Skeleton from '../components/ui/Skeleton'

const TYPES = [
  { key: 'static', title: 'Static Site', desc: 'Vite, React, Vue, Astro, docs, portfolios, and marketing sites.', plan: 'Free', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'M3 5h18M5 5v14h14V5M8 9h8M8 13h5' },
  { key: 'node', title: 'Node.js App', desc: 'Express, APIs, workers, dashboards, and long-running services.', plan: 'Starter', colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5l-8 4.5-8-4.5' },
  { key: 'go', title: 'Go Service', desc: 'Fast HTTP services, background jobs, and small binaries.', plan: 'Starter', colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: 'M4 7h10a5 5 0 010 10H4m3-5h11M4 10h3m-3 4h3' },
  { key: 'python', title: 'Python App', desc: 'FastAPI, Flask, automation services, and ML-backed APIs.', plan: 'Starter', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'M12 4h4a4 4 0 014 4v2h-8a4 4 0 00-4 4v6H8a4 4 0 01-4-4v-4a4 4 0 014-4h8m-4 12H8a4 4 0 01-4-4v-2h8a4 4 0 004-4V4h4a4 4 0 014 4v4a4 4 0 01-4 4h-8' },
  { key: 'java', title: 'Java Service', desc: 'Spring Boot and JVM services with Pro resources.', plan: 'Pro', colorClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: 'M8 18h8M10 14h4m-5-3h6a3 3 0 000-6H9v13m3-13v13' },
]

const TYPE_GLYPH = { node: 'N', static: 'S', go: 'Go', python: 'Py', java: 'Jv' }
const TYPE_LABEL = { node: 'Node.js', static: 'Static', go: 'Go', python: 'Python', java: 'Java' }

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

// ── Updated ProjectRow (mobile‑friendly) ─────────────────────────────────
function ProjectRow({ project, rowRef }) {
  const navigate = useNavigate()
  const displayUrl = getDisplayUrl(project)
  const isInternal = project.isMicroservice && project.internalUrl
  const showVersion = project.type !== 'static' && project.version
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
      className="group relative flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-3 px-5 py-4 md:py-4 cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.015] active:bg-white/[0.005] transition-all duration-200"
    >
      {/* Left accent bar */}
      <span className="absolute left-0 top-0 md:top-1/4 h-[3px] md:h-1/2 w-full md:w-[2.5px] rounded-r-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-all duration-200" />

      {/* Row 1: Icon + Name + Badges + Status (always visible) */}
      <div className="w-full md:col-span-5 flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl grid place-items-center text-xs font-bold tracking-tight shrink-0 bg-white/[0.02] border border-white/[0.05] text-neutral-300 shadow-inner font-mono">
          {TYPE_GLYPH[project.type] || project.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 flex flex-col md:block">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm md:text-[15px] tracking-tight truncate group-hover:text-amber-400 transition-colors">{project.name}</span>
            {project.plan === 'pro' && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20">Pro</span>
            )}
            {project.isMicroservice && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-violet-500/10 text-violet-400 border border-violet-500/20">μSVC</span>
            )}
          </div>
          {isInternal ? (
            <span className="text-xs font-medium text-neutral-500 truncate block mt-0.5">
              {displayUrl} <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">· internal</span>
            </span>
          ) : (
            <a href={`https://${displayUrl}`} target="_blank" rel="noreferrer"
              className="text-xs font-medium text-neutral-500 truncate block mt-0.5 hover:text-white transition-colors">
              {displayUrl}
            </a>
          )}
        </div>
        {/* Status badge on mobile sits beside icon? Actually we want it top-right, so here */}
        <div className="md:hidden ml-auto">
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Mobile compact details grid (shown only on small screens) */}
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1.5 md:hidden text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Runtime</span>
          <div className="text-neutral-300 mt-0.5 flex items-center gap-1">
            {TYPE_LABEL[project.type] || project.type}
            {showVersion && <span className="px-1 py-0 rounded text-[10px] font-mono bg-white/[0.03] text-neutral-400 border border-white/[0.04]">v{project.version}</span>}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Builds</span>
          <div className="text-neutral-300 mt-0.5 font-mono">
            {project.totalBuilds ?? 0} <span className="text-[9px] font-sans uppercase tracking-wider font-extrabold text-neutral-500">blds</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Telemetry</span>
          <div className="flex items-center gap-2 mt-0.5 text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount}/3
            </span>
            <span className={`inline-flex items-center gap-1 ${project.monitorEnabled ? 'text-emerald-400' : 'text-neutral-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${project.monitorEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              {project.monitorEnabled ? 'Monitor' : 'Off'}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Updated</span>
          <div className="text-neutral-400 font-mono mt-0.5">{timeAgo(project.updatedAt)}</div>
        </div>
      </div>

      {/* Desktop columns (hidden on mobile) */}
      <div className="hidden md:flex md:col-span-2 items-center text-xs font-semibold text-neutral-300 gap-1.5">
        {TYPE_LABEL[project.type] || project.type}
        {showVersion && <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] text-neutral-400 border border-white/[0.04]">v{project.version}</span>}
      </div>
      <div className="hidden md:block md:col-span-1 text-xs font-semibold text-neutral-300 font-mono">
        {project.totalBuilds ?? 0} <span className="text-[9px] font-sans uppercase tracking-wider font-extrabold text-neutral-500">blds</span>
      </div>
      <div className="hidden md:flex md:col-span-2 items-center gap-3.5 text-[11px] font-semibold text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifCount}/3
        </span>
        <span className={`inline-flex items-center gap-1.5 ${project.monitorEnabled ? 'text-emerald-400' : 'text-neutral-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${project.monitorEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
          {project.monitorEnabled ? 'Monitor' : 'Off'}
        </span>
      </div>

      {/* Actions column (mobile: bottom of card) */}
      <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 mt-1 md:mt-0 border-t border-white/[0.06] md:border-0">
        <span className="hidden md:block text-xs font-mono font-medium text-neutral-500 mr-3">{timeAgo(project.updatedAt)}</span>
        <div className="hidden md:block">
          <StatusBadge status={project.status} />
        </div>
        <Link
          to={`/project/${project._id}`}
          onClick={e => e.stopPropagation()}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/[0.04] text-neutral-300 bg-white/[0.01] hover:text-white hover:border-amber-500/30 hover:bg-amber-500/[0.02] active:scale-95 shadow-sm transition-all duration-150 ml-auto md:ml-0"
        >
          Open
        </Link>
      </div>
    </div>
  )
}

// ── Skeleton, EmptyState, Modal remain same ─────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 items-center gap-4 px-5 py-4.5 animate-pulse border-t border-white/[0.06]">
      <div className="col-span-12 md:col-span-5 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 rounded-md w-32" />
          <Skeleton className="h-2 rounded w-48" />
        </div>
      </div>
      <div className="hidden md:block col-span-2"><Skeleton className="h-3 rounded-md w-20" /></div>
      <div className="hidden md:block col-span-1"><Skeleton className="h-3 rounded-md w-8" /></div>
      <div className="hidden md:block col-span-2"><Skeleton className="h-3 rounded-md w-24" /></div>
      <div className="col-span-12 md:col-span-2 flex justify-end"><Skeleton className="h-7 rounded-lg w-20" /></div>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl grid place-items-center mb-5 bg-white/[0.01] border border-white/[0.04] shadow-xl">
        <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="font-['Outfit'] font-extrabold text-lg text-white mb-1.5 tracking-tight">No deployments yet</h3>
      <p className="text-sm max-w-sm mb-6 text-neutral-500 font-medium leading-relaxed">Ship your frontend or backend services in under a minute.</p>
      <button onClick={onNew}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all shadow-md shadow-amber-500/10">
        <Icon path="M12 4v16m8-8H4" className="w-4 h-4 stroke-[2.5]" />
        New Project
      </button>
    </div>
  )
}

function NewDeployModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl overflow-hidden bg-[#111114] border border-white/[0.06] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] bg-white/[0.02]">
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">New Project</h2>
            <p className="text-xs font-medium text-neutral-500 mt-0.5">Choose a runtime to get started</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
            <svg className="h-4 w-4 stroke-[2.25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {TYPES.map(type => (
            <Link key={type.key} to={`/projects/new/${type.key}`} onClick={onClose}
              className="flex items-start sm:items-center gap-4 rounded-xl p-3.5 border border-transparent hover:border-white/10 hover:bg-white/[0.02] transition-all group">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${type.colorClass}`}>
                <Icon path={type.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">{type.title}</h3>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                    type.plan === 'Pro' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-white/[0.04] text-neutral-400 border-white/[0.06]'
                  }`}>
                    {type.plan}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-neutral-500">{type.desc}</p>
              </div>
              <svg className="w-4 h-4 shrink-0 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all self-center hidden sm:block" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

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

  const handleStatusUpdate = useCallback((projectId, status) => {
    setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status } : p))
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

  const { visibleIds, rowRefs } = useVisibleProjects(filtered)
  useProjectsStatus(visibleIds, handleStatusUpdate)

  const FILTERS = [
    { k: 'all', l: 'All', c: counts.all, color: 'bg-neutral-500' },
    { k: 'running', l: 'Live', c: counts.running, color: 'bg-emerald-500' },
    { k: 'building', l: 'Building', c: counts.building, color: 'bg-sky-500' },
    { k: 'queued', l: 'Queued', c: counts.queued, color: 'bg-amber-500' },
    { k: 'failed', l: 'Failed', c: counts.failed, color: 'bg-red-500' },
    { k: 'stopped', l: 'Stopped', c: counts.stopped, color: 'bg-neutral-700' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      <PageHeader section="Workspace" title="Projects">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-amber-500 hover:bg-amber-400 active:scale-[0.98] shadow-md shadow-amber-500/10 transition-all"
        >
          <Icon path="M12 4v16m8-8H4" className="h-4 w-4 stroke-[2.5]" />
          New Project
        </button>
      </PageHeader>

      {error && (
        <div className="px-4 py-3.5 rounded-xl text-sm font-semibold bg-red-500/5 text-red-400 border border-red-500/15">
          {error}
        </div>
      )}

      {!loading && projects.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search projects or domains…"
                className="w-full pl-9.5 pr-4 py-2 text-xs bg-black/20 border border-white/[0.06] rounded-lg text-white outline-none placeholder-neutral-600 focus:border-amber-500/40 focus:bg-black/40 transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs font-bold rounded-lg px-3 py-2 bg-black/20 border border-white/[0.06] text-neutral-400 outline-none cursor-pointer hover:border-white/10 hover:text-white transition-all"
            >
              <option value="recent">Order: Recent</option>
              <option value="name">Order: Name</option>
              <option value="builds">Order: Most Builds</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar max-w-full">
            {FILTERS.map(t => {
              const active = filter === t.k
              return (
                <button
                  key={t.k}
                  onClick={() => setFilter(t.k)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                    active
                      ? 'bg-white/[0.08] border-white/10 text-white'
                      : 'bg-transparent border-transparent text-neutral-500 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${t.color}`} />
                  {t.l}
                  <span className={`tabular-nums font-mono text-[10px] ml-0.5 ${active ? 'text-neutral-300' : 'text-neutral-600'}`}>{t.c}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06] shadow-xl">
        {!loading && filtered.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600 bg-black/20 border-b border-white/[0.06]">
            <div className="col-span-5">Project</div>
            <div className="col-span-2">Runtime</div>
            <div className="col-span-1">Builds</div>
            <div className="col-span-2">Telemetry</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
        )}

        {loading ? (
          <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
        ) : filtered.length === 0 ? (
          projects.length === 0
            ? <EmptyState onNew={() => setModalOpen(true)} />
            : <div className="py-16 text-center text-xs font-bold tracking-wide text-neutral-600">No projects match your filters.</div>
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