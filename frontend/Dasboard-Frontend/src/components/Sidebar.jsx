import { Link, useLocation } from 'react-router-dom'
import { useSidebar } from './SidebarContext'

const NAV_LINKS = [
  { to: '/', label: 'Projects', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/builds', label: 'Builds', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
  { to: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/settings/sessions', label: 'Sessions', icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
]

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

function SidebarLink({ to, label, icon, active, onClick, expanded }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group/item relative flex items-center h-10 mx-2 rounded-lg transition-colors
        ${active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-amber-500" />
      )}
      <span className="w-14 flex items-center justify-center flex-shrink-0">
        <NavIcon d={icon} active={active} />
      </span>
      <span
        className={`whitespace-nowrap text-sm font-medium text-neutral-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 group-hover/item:text-white pointer-events-none group-hover:pointer-events-auto
        ${expanded ? 'max-md:opacity-100 max-md:translate-x-0' : ''}`}
      >
        {label}
      </span>
      <span className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium text-white bg-[#18181c] border border-white/[0.06] opacity-0 pointer-events-none group-hover:opacity-0 group-hover/item:opacity-0 md:group-hover:opacity-0 md:group-hover/item:opacity-0 md:group-[&:not(:hover)]:group-hover/item:opacity-100 md:group-[&:not(:hover)]:group-hover/item:pointer-events-auto z-50 whitespace-nowrap">
        {label}
      </span>
    </Link>
  )
}

export default function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar()
  const location = useLocation()

  const isActive = (to) => {
    if (to === '/' && location.pathname === '/') return true
    if (to === '/builds' && location.pathname.toLowerCase().startsWith('/build')) return true
    return location.pathname === to
  }

  const close = () => setIsSidebarOpen(false)

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
        <div className="h-14 flex items-center border-b border-white/[0.06] flex-shrink-0">
          <div className="w-14 flex items-center justify-center flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-white/[0.06] flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </div>
          </div>
          <span className="text-sm font-semibold text-white whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            DeployHub
          </span>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_LINKS.map(link => (
            <SidebarLink
              key={link.to}
              to={link.to}
              label={link.label}
              icon={link.icon}
              active={isActive(link.to)}
              onClick={close}
              expanded={isSidebarOpen}
            />
          ))}
        </nav>
      </aside>
    </>
  )
}