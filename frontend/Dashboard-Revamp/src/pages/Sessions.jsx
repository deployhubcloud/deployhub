import { useEffect, useState } from 'react'
import { api } from '../api/apiclient'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/ui/Skeleton'

function getDeviceInfo(userAgent = '') {
  const ua = userAgent.toLowerCase()
  let browser = 'Unknown Browser'
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'
  let os = 'Unknown OS'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  else if (ua.includes('linux')) os = 'Linux'
  return { browser, os }
}

function DeviceIcon({ os }) {
  if (os === 'Android' || os === 'iOS') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-5 h-5"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18.5" strokeLinecap="round" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </svg>
  )
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Sessions() {
  const { logout } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(null)
  const [revokeAll, setRevokeAll] = useState(false)
  const [error, setError] = useState(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/auth/sessions')
      setSessions(res.data.sessions || [])
    } catch {
      setError('Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleRevoke = async (session) => {
    try {
      setRevoking(session.tokenId)
      await api.delete(`/auth/sessions/${session.tokenId}`)
      if (session.current) {
        logout()
        return
      }
      setSessions((prev) => prev.filter((s) => s.tokenId !== session.tokenId))
    } catch (err) {
      if (err?.response?.status === 401) {
        logout()
        return
      }
      setError('Failed to revoke session.')
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    try {
      setRevokeAll(true)
      await api.delete('/auth/sessions')
      logout()
    } catch (err) {
      if (err?.response?.status === 401) {
        logout()
        return
      }
      setError('Failed to revoke all sessions.')
      setRevokeAll(false)
    }
  }

  const currentSession = sessions.find((s) => s.current)
  const otherSessions = sessions.filter((s) => !s.current)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader section="Account" title="Sessions" />

      <p className="text-sm text-slate-500 mb-6 -mt-4">
        Devices currently logged into your account.
      </p>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <SessionsSkeleton />
      ) : (
        <div className="space-y-3">
          {currentSession &&
            (() => {
              const { browser, os } = getDeviceInfo(currentSession.userAgent)
              return (
                <div className="bg-white border border-emerald-500/20 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 flex-shrink-0">
                      <DeviceIcon os={os} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-slate-900 font-medium text-sm">
                          {browser} · {os}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-status-pulse" />
                          Current
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>{currentSession.ip || 'Unknown IP'}</span>
                        <span>·</span>
                        <span>{timeAgo(currentSession.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(currentSession)}
                      disabled={revoking === currentSession.tokenId}
                      className="flex-shrink-0 text-xs border border-slate-200 text-slate-600 hover:border-red-500/30 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                    >
                      {revoking === currentSession.tokenId ? 'Logging out…' : 'Logout'}
                    </button>
                  </div>
                </div>
              )
            })()}

          {otherSessions.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2 pb-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Other sessions
                </span>
                <div className="flex-1 h-px bg-slate-900/[0.06]" />
                <span className="text-xs text-slate-400">{otherSessions.length}</span>
              </div>
              {otherSessions.map((session) => {
                const { browser, os } = getDeviceInfo(session.userAgent)
                return (
                  <div
                    key={session.tokenId}
                    className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-900/[0.04] border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <DeviceIcon os={os} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-medium text-sm mb-0.5">
                          {browser} · {os}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span>{session.ip || 'Unknown IP'}</span>
                          <span>·</span>
                          <span>{timeAgo(session.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevoke(session)}
                        disabled={revoking === session.tokenId}
                        className="flex-shrink-0 text-xs border border-slate-200 text-slate-500 hover:border-red-500/30 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {revoking === session.tokenId ? 'Revoking…' : 'Revoke'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No active sessions found.
            </div>
          )}

          {otherSessions.length > 0 && (
            <div className="pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-900 font-medium mb-0.5">
                    Logout from all other devices
                  </p>
                  <p className="text-xs text-slate-500">Revoke all sessions except this one.</p>
                </div>
                <button
                  onClick={handleRevokeAll}
                  disabled={revokeAll}
                  className="flex-shrink-0 text-xs text-red-600 border border-red-500/20 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all disabled:opacity-50 font-medium"
                >
                  {revokeAll ? 'Logging out…' : 'Logout everywhere'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
