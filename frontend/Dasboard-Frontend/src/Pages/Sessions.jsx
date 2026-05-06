import { useEffect, useState } from 'react'
import { api } from '../api/apiclient'
import { useAuth } from '../context/AuthContext'


function getDeviceInfo(userAgent = '') {
  const ua = userAgent.toLowerCase()

  let browser = 'Unknown Browser'
  if (ua.includes('chrome') && !ua.includes('edg'))          browser = 'Chrome'
  else if (ua.includes('firefox'))                            browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome'))   browser = 'Safari'
  else if (ua.includes('edg'))                                browser = 'Edge'
  else if (ua.includes('opera') || ua.includes('opr'))        browser = 'Opera'

  let os = 'Unknown OS'
  if (ua.includes('windows'))                                os = 'Windows'
  else if (ua.includes('mac'))                               os = 'macOS'
  else if (ua.includes('android'))                           os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad'))     os = 'iOS'
  else if (ua.includes('linux'))                             os = 'Linux'

  return { browser, os }
}

function DeviceIcon({ os }) {
  if (os === 'Android' || os === 'iOS') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18.5" strokeLinecap="round" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </svg>
  )
}

function timeAgo(ts) {
  const diff  = Date.now() - ts
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Sessions() {
  const { logout } = useAuth()

  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [revoking,  setRevoking]  = useState(null)
  const [revokeAll, setRevokeAll] = useState(false)
  const [error,     setError]     = useState(null)

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

      // Doosra session — sirf list se hatao
      setSessions(prev => prev.filter(s => s.tokenId !== session.tokenId))
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
      // Sab revoke ho gaye — is device pe bhi logout
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

  const currentSession = sessions.find(s => s.current)
  const otherSessions  = sessions.filter(s => !s.current)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-syne font-black text-2xl text-white mb-1">Active Sessions</h1>
        <p className="text-gray-500 text-sm">
          Devices currently logged into your account. Revoke any session you don't recognize.
        </p>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">

          {/* Current session */}
          {currentSession && (() => {
            const { browser, os } = getDeviceInfo(currentSession.userAgent)
            return (
              <div className="bg-[#0d1117] border border-[#00e5ff]/25 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] flex-shrink-0">
                    <DeviceIcon os={os} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-white font-semibold text-sm">{browser} · {os}</span>
                      <span className="inline-flex items-center gap-1 bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
                        Current
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span>{currentSession.ip || 'Unknown IP'}</span>
                      <span>·</span>
                      <span>{timeAgo(currentSession.createdAt)}</span>
                    </div>
                  </div>

                  {/* Current session pe bhi logout button */}
                  <button
                    onClick={() => handleRevoke(currentSession)}
                    disabled={revoking === currentSession.tokenId}
                    className="flex-shrink-0 text-xs text-gray-600 border border-white/8 hover:border-red-500/40 hover:text-red-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                  >
                    {revoking === currentSession.tokenId ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Other sessions */}
          {otherSessions.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2 pb-1">
                <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Other sessions</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-gray-600">{otherSessions.length}</span>
              </div>

              {otherSessions.map(session => {
                const { browser, os } = getDeviceInfo(session.userAgent)
                return (
                  <div
                    key={session.tokenId}
                    className="group bg-[#0d1117] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-500 flex-shrink-0">
                        <DeviceIcon os={os} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm mb-0.5">{browser} · {os}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span>{session.ip || 'Unknown IP'}</span>
                          <span>·</span>
                          <span>{timeAgo(session.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevoke(session)}
                        disabled={revoking === session.tokenId}
                        className="flex-shrink-0 text-xs text-gray-500 border border-white/8 hover:border-red-500/40 hover:text-red-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {revoking === session.tokenId ? 'Revoking...' : 'Revoke'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {sessions.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-600 text-sm">
              No active sessions found.
            </div>
          )}

          {/* Revoke all */}
          {otherSessions.length > 0 && (
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white font-medium mb-0.5">Logout from all other devices</p>
                  <p className="text-xs text-gray-500">This will immediately revoke all sessions except this one.</p>
                </div>
                <button
                  onClick={handleRevokeAll}
                  disabled={revokeAll}
                  className="flex-shrink-0 text-xs text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 px-4 py-2 rounded-lg transition-all disabled:opacity-50 font-medium"
                >
                  {revokeAll ? 'Logging out...' : 'Logout everywhere'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
