import UserChip from './UserChip'
import { useSidebar } from './SidebarContext'

export default function PageHeader({ section, title, children }) {
  const { setIsSidebarOpen } = useSidebar()

  return (
    <header className="flex items-center justify-between mb-8 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">{section}</p>
          <h1 className="text-2xl font-semibold text-white truncate">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {children}
        <UserChip />
      </div>
    </header>
  )
}
