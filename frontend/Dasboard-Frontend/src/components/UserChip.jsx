import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UserChip() {
  const { logout, user } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const fullname = user?.fullName || user?.fullname || 'Account'
  const profilePic = user?.profilePic || ''
  const initials = fullname.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-white/[0.06] bg-[#111114] hover:border-white/10 transition-colors"
      >
        {profilePic ? (
          <img src={profilePic} alt={fullname} className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold bg-amber-500/20 text-amber-400 flex-shrink-0">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-white">{fullname.split(' ')[0]}</span>
        <svg className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl py-1.5 z-50 bg-[#111114] border border-white/[0.06] shadow-xl">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="text-sm font-medium text-white truncate">{fullname}</div>
            <div className="text-xs text-neutral-500 truncate mt-0.5">{user?.email || ''}</div>
          </div>
          <div className="py-1">
            {[
              { to: '/', label: 'Dashboard' },
              { to: '/profile', label: 'Profile' },
              { to: '/settings/sessions', label: 'Sessions' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-white/[0.06] pt-1">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
