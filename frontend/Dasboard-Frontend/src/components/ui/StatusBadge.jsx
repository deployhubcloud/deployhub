const CONFIG = {
  running: { label: 'Running', dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400', pulse: true },
  live: { label: 'Running', dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400', pulse: true },
  building: { label: 'Building', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', pulse: true },
  queued: { label: 'Queued', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', pulse: false },
  failed: { label: 'Failed', dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400', pulse: false },
  failure: { label: 'Failed', dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400', pulse: false },
  stopped: { label: 'Stopped', dot: 'bg-neutral-500', bg: 'bg-white/[0.04]', text: 'text-neutral-400', pulse: false },
  success: { label: 'Success', dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400', pulse: false },
  pending: { label: 'Building', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', pulse: true },
}

export default function StatusBadge({ status, className = '' }) {
  const key = (status || 'stopped').toLowerCase()
  const s = CONFIG[key] || CONFIG.stopped

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border border-white/[0.06] ${s.bg} ${s.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot} ${s.pulse ? 'animate-status-pulse' : ''}`} />
      {s.label}
    </span>
  )
}
