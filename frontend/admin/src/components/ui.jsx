export function StatusBadge({ value }) {
  const v = String(value || 'unknown').toLowerCase()
  let cls = 'badge-gray'
  if (['running', 'live', 'active', 'success', 'paid', 'healthy'].includes(v)) cls = 'badge-green'
  else if (['failed', 'crash', 'suspend', 'deleted', 'disabled', 'unhealthy', 'dead', 'missing'].includes(v)) cls = 'badge-red'
  else if (['building', 'deploying', 'queued', 'pending', 'pending_payment', 'restarting', 'created'].includes(v)) cls = 'badge-amber'
  else if (['stopped', 'draft', 'exited', 'paused'].includes(v)) cls = 'badge-blue'
  return <span className={`badge ${cls}`}>{v}</span>
}

export function StatCard({ label, value, hint, onClick }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`card p-5 text-left ${onClick ? 'hover:border-[var(--accent)] transition cursor-pointer w-full' : ''}`}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className="text-3xl font-semibold mt-2 tabular-nums">{value ?? '—'}</div>
      {hint ? <div className="text-xs text-[var(--muted)] mt-2">{hint}</div> : null}
    </Comp>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-[var(--muted)] mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({ title, text }) {
  return (
    <div className="px-4 py-10 text-center text-[var(--muted)]">
      <div className="font-medium text-[var(--text)]">{title}</div>
      {text ? <div className="text-sm mt-1">{text}</div> : null}
    </div>
  )
}

export function ConfirmButton({
  className = 'btn btn-danger',
  label,
  confirmText,
  onConfirm,
  disabled,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={() => {
        if (window.confirm(confirmText || `Confirm: ${label}?`)) onConfirm?.()
      }}
    >
      {label}
    </button>
  )
}
