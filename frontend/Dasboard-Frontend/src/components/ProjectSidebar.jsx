import { useState, useEffect } from 'react'
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { useSidebar } from './SidebarContext'
import { api } from '../api/apiclient'
import Skeleton from './ui/Skeleton'

const ICONS = {
  overview: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  logs: 'M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8',
  builds: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  metrics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  domains: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  billing: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
}

function NavIcon({ d, active }) {
  return (
    <svg
      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'text-amber-500' : 'text-neutral-500 group-hover/item:text-neutral-300'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  )
}

function SidebarLink({ to, label, icon, active, onClick, state, badge, expanded }) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      className={`group/item relative flex items-center h-10 mx-2 rounded-lg transition-colors
        ${active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-amber-500" />
      )}
      <span className="w-14 flex items-center justify-center flex-shrink-0 relative">
        <NavIcon d={icon} active={active} />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
        )}
      </span>
      <span
        className={`flex-1 flex items-center justify-between pr-3 whitespace-nowrap text-sm font-medium text-neutral-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 group-hover/item:text-white pointer-events-none group-hover:pointer-events-auto
        ${expanded ? 'max-md:opacity-100 max-md:translate-x-0' : ''}`}
      >
        {label}
        {badge && (
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pro
          </span>
        )}
      </span>
    </Link>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-14 z-50 flex flex-col bg-[#111114] border-r border-white/[0.06]">
      <div className="h-14 flex items-center justify-center border-b border-white/[0.06]">
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <div className="py-3 space-y-2 px-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </aside>
  )
}

export default function ProjectSidebar() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar()
  const location = useLocation()
  const [projectName, setProjectName] = useState(location.state?.projectName || '')
  const [plan, setPlan] = useState(location.state?.plan || null)
  const [type, setType] = useState(location.state?.type || null)
  const [bootstrapLoading, setBootstrap] = useState(!location.state?.projectName)

  useEffect(() => {
    if (!projectId) return
    api.get(`/project/${projectId}/meta`)
      .then(res => {
        setProjectName(res.data.projectData?.name || 'Project')
        setPlan(res.data.projectData?.plan || 'free')
        setType(res.data.projectData?.type || null)
      })
      .catch(() => navigate('/'))
      .finally(() => setBootstrap(false))
  }, [projectId, navigate])

  const isActive = (path) => location.pathname === path
  const close = () => setIsSidebarOpen(false)
  const navState = { projectName, plan, type }

  const navLinks = [
    { to: `/project/${projectId}`, label: 'Overview', icon: ICONS.overview },
    { to: `/project/${projectId}/logs`, label: 'Logs', icon: ICONS.logs },
    { to: `/project/${projectId}/builds`, label: 'Builds', icon: ICONS.builds },
    ...(type && type !== 'static'
      ? [{ to: `/project/${projectId}/metrics`, label: 'Metrics', icon: ICONS.metrics }]
      : []),
    { to: `/project/${projectId}/settings`, label: 'Settings', icon: ICONS.settings },
    { to: `/project/${projectId}/domains`, label: 'Domains', icon: ICONS.domains, proBadge: plan === 'pro' },
    { to: `/project/${projectId}/billing`, label: 'Billing', icon: ICONS.billing },
  ]

  if (bootstrapLoading) return <SidebarSkeleton />

  const initial = projectName.charAt(0).toUpperCase()

  return (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={close} />
      )}

      <aside
        className={`group fixed top-0 left-0 h-screen z-50 flex flex-col bg-[#111114] border-r border-white/[0.06]
          w-[220px] md:w-14 md:hover:w-[220px] transition-[width] duration-200 ease-out overflow-hidden
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-14 flex items-center border-b border-white/[0.06] flex-shrink-0 min-w-0">
          <div className="w-14 flex items-center justify-center flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-amber-400">
              {initial}
            </div>
          </div>
          <span className="text-sm font-semibold text-white truncate opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pr-3">
            {projectName}
          </span>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navLinks.map(link => (
            <SidebarLink
              key={link.to}
              to={link.to}
              label={link.label}
              icon={link.icon}
              active={isActive(link.to)}
              onClick={close}
              state={navState}
              badge={link.proBadge}
              expanded={isSidebarOpen}
            />
          ))}
        </nav>

        <div className="py-3 border-t border-white/[0.06]">
          <SidebarLink
            to="/"
            label="Back to Workspace"
            icon={ICONS.back}
            active={false}
            onClick={close}
            expanded={isSidebarOpen}
          />
        </div>
      </aside>
    </>
  )
}