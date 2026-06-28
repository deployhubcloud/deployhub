import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/apiclient'
import { useProjectStatus } from '../hooks/useProjectStatus'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import Skeleton from '../components/ui/Skeleton'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function ConfirmRedeployModal({ projectName, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-sm rounded-xl overflow-hidden bg-[#111114] border border-white/[0.06]">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Redeploy Project?</h3>
          <p className="text-sm text-neutral-500 mb-6">
            This will trigger a fresh build for{' '}
            <span className="font-medium text-neutral-300">{projectName}</span>.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-white/10 text-neutral-300 hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-60"
            >
              {loading ? 'Deploying…' : 'Yes, Redeploy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.06] last:border-0">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Overview() {
  const { id: projectId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [redeployLoading, setRedeployLoading] = useState(false)
  const [redeployError, setRedeployError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/project/overview/${projectId}`)
      .then(res => setProject(res.data.data))
      .catch(() => setError('Failed to load project.'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleStatusUpdate = useCallback((status) => {
    setProject(prev => prev ? { ...prev, stats: status } : prev)
  }, [])

  useProjectStatus(projectId, handleStatusUpdate)

  async function handleRedeploy() {
    setRedeployLoading(true)
    setRedeployError(null)
    try {
      const res = await api.post(`/project/redeploy/${projectId}`)
      if (res.status === 200) {
        setProject(prev => ({ ...prev, stats: 'building' }))
        setShowConfirm(false)
      }
    } catch (err) {
      setRedeployError(err?.response?.data?.message || 'Failed to redeploy. Please try again.')
    } finally {
      setRedeployLoading(false)
    }
  }

  const p = project
  const lastBuild = p?.latestBuildData
  const statusKey = p?.stats || 'stopped'

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader section="Project" title={loading ? 'Loading…' : p?.name || 'Overview'}>
        {!loading && (
          <div className="flex items-center gap-2">
            {!p?.isMicroservice && p?.domain && (
              <a
                href={`https://${p.domain}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-neutral-300 hover:bg-white/5 transition-colors"
              >
                Visit Site
              </a>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={redeployLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
            >
              Redeploy
            </button>
          </div>
        )}
      </PageHeader>

      {showConfirm && (
        <ConfirmRedeployModal
          projectName={p?.name}
          onConfirm={handleRedeploy}
          onCancel={() => { setShowConfirm(false); setRedeployError(null) }}
          loading={redeployLoading}
        />
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {redeployError && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-between">
          {redeployError}
          <button onClick={() => setRedeployError(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {loading ? (
        <OverviewSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Total Builds</p>
              <p className="text-3xl font-semibold text-white tabular-nums">{p?.totalBuilds ?? 0}</p>
            </div>
            <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Last Deploy</p>
              <p className="text-3xl font-semibold text-white">
                {lastBuild?.createdAt ? timeAgo(lastBuild.createdAt) : '—'}
              </p>
            </div>
            <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Status</p>
              <div className="mt-1">
                <StatusBadge status={statusKey} />
              </div>
            </div>
          </div>

          <div className="bg-[#111114] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-medium text-white">Recent Builds</h2>
              <Link to={`/project/${projectId}/builds`} className="text-xs text-neutral-500 hover:text-amber-400 transition-colors">
                View all →
              </Link>
            </div>
            {!lastBuild ? (
              <div className="py-12 text-center text-sm text-neutral-500">No builds yet</div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                <div className="flex items-center gap-4 px-5 py-3.5 text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    lastBuild.status === 'success' ? 'bg-green-500' :
                    lastBuild.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-status-pulse'
                  }`} />
                  <span className="font-mono text-xs text-neutral-400 w-16 flex-shrink-0">
                    {lastBuild.commitSha?.slice(0, 7) || '—'}
                  </span>
                  <span className="flex-1 text-neutral-300 truncate">
                    {lastBuild.message || `Build ${lastBuild.status}`}
                  </span>
                  <span className="text-xs text-neutral-500 flex-shrink-0">{timeAgo(lastBuild.createdAt)}</span>
                  {lastBuild.timeTaken != null && (
                    <span className="text-xs font-mono text-neutral-500 flex-shrink-0">{lastBuild.timeTaken}s</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid lg:grid-cols-2 gap-4">
            <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Deployment Info</p>
              <div className="space-y-3">
                {[
                  !p.isMicroservice && p.domain ? { k: 'Domain', v: p.domain, link: `https://${p.domain}` } : null,
                  p.isMicroservice && p.internalUrl ? { k: 'Internal URL', v: p.internalUrl } : null,
                  { k: 'Repo', v: p.repoUrl?.replace('https://github.com/', ''), link: p.repoUrl },
                  { k: 'Branch', v: p.branch || 'main' },
                  { k: 'Type', v: `${p.type}${p.version ? ` · v${p.version}` : ''}` },
                ].filter(Boolean).map(row => (
                  <div key={row.k} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-neutral-500">{row.k}</span>
                    {row.link ? (
                      <a href={row.link} target="_blank" rel="noreferrer" className="text-xs font-mono text-neutral-400 hover:text-amber-400 truncate max-w-[60%] text-right transition-colors">
                        {row.v}
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-neutral-300 truncate max-w-[60%] text-right">{row.v}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Monitor & Alerts</p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.monitorEnabled ? 'bg-green-500 animate-status-pulse' : 'bg-neutral-600'}`} />
                  <span className="text-neutral-300">{p.monitorEnabled ? 'Monitor enabled' : 'Monitor disabled'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['discord', 'telegram', 'email'].map(ch => {
                    const enabled = p.notifications?.[ch]
                    return (
                      <span key={ch} className={`text-[11px] font-medium px-2 py-1 rounded-md border ${
                        enabled ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/[0.02] text-neutral-600 border-white/[0.06]'
                      }`}>
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
