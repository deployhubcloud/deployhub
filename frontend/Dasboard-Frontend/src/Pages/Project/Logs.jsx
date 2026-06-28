import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectLogs } from '../../hooks/useProjectLogs.js'
import PageHeader from '../../components/PageHeader'
import Skeleton from '../../components/ui/Skeleton'

function getLineColor(line) {
  if (/^\[ERROR\]|error|failed|fatal/i.test(line)) return 'text-red-400'
  if (/^\[INFO\]|info/i.test(line)) return 'text-neutral-400'
  if (/success|complete|done/i.test(line)) return 'text-green-400'
  return 'text-neutral-200'
}

function LogsSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111114] border border-white/[0.06] rounded-t-xl">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20 ml-auto" />
      </div>
      <div className="flex-1 bg-[#0d0d0d] border border-t-0 border-white/[0.06] rounded-b-xl p-4 space-y-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-6 flex-shrink-0" />
            <Skeleton className={`h-4 ${['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3'][i % 4]}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Logs() {
  const { id: projectId } = useParams()
  const {
    logs,
    loading,
    connected,
    isStaticProject,
    staticFailed,
    staticFailedMessage,
    staticFailedLogsUrl
  } = useProjectLogs(projectId)

  const bottomRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, autoScroll])

  const flatLogs = logs.flatMap(entry => String(entry).split('\n')).filter(Boolean)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader section="Project" title="Logs" />

      {loading ? (
        <LogsSkeleton />
      ) : (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#111114] border border-white/[0.06] rounded-t-xl">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-white">Live Logs</span>
            <span className="text-xs text-neutral-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            <button
              onClick={() => setAutoScroll(v => !v)}
              className={`ml-auto text-xs px-2.5 py-1 rounded-md border transition-colors ${
                autoScroll
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  : 'border-white/10 text-neutral-400 hover:bg-white/5'
              }`}
            >
              Auto-scroll {autoScroll ? 'on' : 'off'}
            </button>
          </div>

          <div className="flex-1 bg-[#0d0d0d] border border-t-0 border-white/[0.06] rounded-b-xl overflow-y-auto font-mono text-sm">
            {/* Special case: static build failed */}
            {staticFailed ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4">
                <p className="text-red-400 text-sm">{staticFailedMessage}</p>
                {staticFailedLogsUrl && (
                  <a
                    href={staticFailedLogsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    View build logs ↗
                  </a>
                )}
              </div>
            ) : isStaticProject && flatLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-500 text-sm px-6 text-center">
                Runtime logs are not available for static projects.
              </div>
            ) : loading && flatLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
                Establishing connection<span className="animate-cursor-blink ml-0.5">▌</span>
              </div>
            ) : flatLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
                No logs available.
              </div>
            ) : (
              <div className="py-2">
                {flatLogs.map((line, i) => (
                  <div key={i} className="flex gap-3 px-4 py-0.5 hover:bg-white/[0.02]">
                    <span className="text-neutral-700 select-none w-8 text-right flex-shrink-0 text-xs pt-0.5">
                      {i + 1}
                    </span>
                    <span className={`whitespace-pre-wrap break-all ${getLineColor(line)}`}>{line}</span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}