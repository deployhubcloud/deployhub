import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/apiclient'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Skeleton from '../../components/ui/Skeleton'

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function formatDateTime(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function daysUntil(date) {
    if (!date) return Infinity
    const now = new Date()
    const end = new Date(date)
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
}

function daysBetween(a, b) {
    if (!a || !b) return 0
    return Math.max(
        1,
        Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))
    )
}

// amount is in paise (INR)
function formatINR(paise) {
    const rupees = (Number(paise) || 0) / 100
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(rupees)
}

// billingHistory can be object {"0": {...}} or array
function normalizeHistory(h) {
    if (!h) return []
    if (Array.isArray(h)) return h
    return Object.keys(h)
        .sort((a, b) => Number(a) - Number(b))
        .map(k => h[k])
}

// -------------------------------------------------------------
// Skeleton
// -------------------------------------------------------------
function BillingSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
                <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <div className="pt-3 space-y-2">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-14 rounded-xl" />
                        <Skeleton className="h-14 rounded-xl" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
                <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// Sub components
// -------------------------------------------------------------
function ResourceTile({ label, value }) {
    return (
        <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.12] transition-colors">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                {label}
            </p>
            <p className="text-lg font-semibold text-white font-mono">
                {value || '—'}
            </p>
        </div>
    )
}

function FeatureRow({ label, included, value }) {
    const muted = included === false
    return (
        <div
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${muted ? 'opacity-40' : 'hover:bg-white/[0.02]'
                }`}
        >
            <div className="flex items-center gap-2.5">
                {included !== undefined ? (
                    included ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                    )
                ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                )}
                <span
                    className={`text-sm ${muted ? 'text-neutral-400 line-through' : 'text-neutral-200'
                        }`}
                >
                    {label}
                </span>
            </div>
            {value && (
                <span className="text-xs text-neutral-500 font-mono">{value}</span>
            )}
        </div>
    )
}

function HistoryStatusPill({ status }) {
    const s = (status || '').toLowerCase()
    const map = {
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        failed: 'bg-red-500/10 text-red-400 border-red-500/20',
        refunded: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20',
    }
    const cls = map[s] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${cls}`}>
            {status || 'unknown'}
        </span>
    )
}

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------
export function Billing() {
    const { id: projectId } = useParams()
    const [billing, setBilling] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('deployment')

    useEffect(() => {
        api
            .get('/project/billing/' + projectId)
            .then(r => setBilling(r.data.data))
            .catch(() => setError('Failed to load billing information.'))
            .finally(() => setLoading(false))
    }, [projectId])

    const plan = useMemo(() => billing?.planDeatils || {}, [billing])
    const planName = plan.name || billing?.plan || 'unknown'
    const price = plan.price ?? null
    const isFree = price === 0 || planName.toLowerCase() === 'free'
    const paymentStatus = billing?.paymentStatus || 'unknown'

    const daysLeft = useMemo(() => {
        if (!billing?.endDate) return Infinity
        return daysUntil(billing.endDate)
    }, [billing])

    const totalDays = useMemo(
        () => daysBetween(billing?.startDate, billing?.endDate),
        [billing]
    )
    const usedDays = Math.max(0, totalDays - Math.max(0, daysLeft))
    const usedPct = isFree
        ? 0
        : Math.min(100, Math.round((usedDays / totalDays) * 100))

    const isExpiringSoon = !isFree && daysLeft <= 15 && daysLeft > 0

    // Billing history (object → array, newest first)
    const history = useMemo(() => {
        const list = normalizeHistory(billing?.billingHistory)
        return [...list].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
    }, [billing])

    const totalSpent = useMemo(
        () => history.reduce((sum, h) => sum + (Number(h.amount) || 0), 0),
        [history]
    )

    // Grouped features
    const groups = {
        deployment: [
            { label: 'Deployments', value: plan.deployment_Type?.join(', ') },
            { label: 'Subdomain', included: plan.subdomain },
            { label: 'Custom domain', included: plan.customDomain },
            { label: 'SSL', included: plan.ssl },
            { label: 'GitHub CI/CD', included: plan.github_Ci_Cd },
        ],
        monitoring: [
            { label: 'AI diagnostics', included: plan.ai_dignostics },
            { label: 'Uptime monitoring', included: plan.uptime_monitoring },
        ],
        alerts: [
            { label: 'Email alerts', included: plan.alerts?.email },
            { label: 'Discord alerts', included: plan.alerts?.discord },
            { label: 'Telegram alerts', included: plan.alerts?.telegram },
        ],
    }

    const tabs = [
        { id: 'deployment', label: 'Deployment', count: groups.deployment.length },
        { id: 'monitoring', label: 'Monitoring', count: groups.monitoring.length },
        { id: 'alerts', label: 'Alerts', count: groups.alerts.length },
    ]

    const scrollToHistory = () => {
        const el = document.getElementById('billing-history')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="max-w-6xl mx-auto">
            <PageHeader section="Project" title="Billing & Plan" />

            {error && (
                <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                    {error}
                </div>
            )}

            {loading ? (
                <BillingSkeleton />
            ) : billing ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* ───────── LEFT: Hero plan panel ───────── */}
                    <aside className="lg:col-span-4">
                        <div className="lg:sticky lg:top-6 bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">
                                        Current Plan
                                    </p>
                                    {isFree ? (
                                        <StatusBadge status="active" className="!rounded-full" />
                                    ) : (
                                        <StatusBadge
                                            status={
                                                isExpiringSoon
                                                    ? 'expiring'
                                                    : paymentStatus === 'paid'
                                                        ? 'active'
                                                        : paymentStatus
                                            }
                                            className="!rounded-full"
                                        />
                                    )}
                                </div>

                                <h3 className="text-2xl font-semibold text-white capitalize mb-3">
                                    {isFree ? 'Free Plan' : planName}
                                </h3>

                                <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-white/[0.06]">
                                    {isFree ? (
                                        <span className="text-4xl font-bold text-white">₹0</span>
                                    ) : (
                                        <span className="text-4xl font-bold text-white">
                                            ₹{price}
                                        </span>
                                    )}
                                    <span className="text-sm text-neutral-500">/month</span>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => { }}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                                    >
                                        {isFree ? 'Upgrade Plan - comming Soon' : 'Change Plan - Comming Soon'}
                                    </button>
                                    <button
                                        onClick={scrollToHistory}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        Billing History
                                    </button>
                                </div>

                                {/* Spend summary */}
                                <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                                            Total Spent
                                        </p>
                                        <p className="text-sm font-semibold text-white font-mono">
                                            {formatINR(totalSpent)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                                            Payments
                                        </p>
                                        <p className="text-sm font-semibold text-white font-mono">
                                            {history.length}
                                        </p>
                                    </div>
                                </div>

                                {isExpiringSoon && (
                                    <div className="mt-5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                        <div className="flex items-start gap-2">
                                            <svg
                                                className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <p className="text-xs text-amber-200 leading-relaxed">
                                                Expires in{' '}
                                                <span className="font-semibold">
                                                    {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                                                </span>
                                                . Renew to avoid service interruption.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* ───────── RIGHT ───────── */}
                    <section className="lg:col-span-8 space-y-6">
                        {/* Billing cycle */}
                        {!isFree && (
                            <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-neutral-200">
                                        Billing Cycle
                                    </h4>
                                    <span className="text-xs text-neutral-500 font-mono">
                                        {usedDays} / {totalDays} days
                                    </span>
                                </div>

                                <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isExpiringSoon
                                                ? 'bg-amber-400'
                                                : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                            }`}
                                        style={{ width: `${usedPct}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                                            Started
                                        </p>
                                        <p className="text-sm font-medium text-neutral-200">
                                            {formatDate(billing.startDate)}
                                        </p>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                                            Renews
                                        </p>
                                        <p className="text-sm font-medium text-neutral-200">
                                            {formatDate(billing.endDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resource tiles */}
                        <div>
                            <h4 className="text-xs uppercase tracking-wider text-neutral-500 mb-3 px-1">
                                Resources
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <ResourceTile label="RAM" value={plan.resources?.ram} />
                                <ResourceTile label="CPU" value={plan.resources?.cpu} />
                                <ResourceTile
                                    label="Storage"
                                    value={plan.resources?.storage}
                                />
                            </div>
                        </div>

                        {/* Features with tabs */}
                        <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-1 p-2 border-b border-white/[0.06] overflow-x-auto">
                                {tabs.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === t.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        {t.label}
                                        <span className="text-[10px] text-neutral-500 font-mono">
                                            {t.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="p-3">
                                {groups[activeTab].map(f => (
                                    <FeatureRow key={f.label} {...f} />
                                ))}
                            </div>
                        </div>

                        {/* ───────── Billing History ───────── */}
                        <div
                            id="billing-history"
                            className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl overflow-hidden scroll-mt-6"
                        >
                            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-200">
                                        Billing History
                                    </h4>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                        {history.length} payment{history.length === 1 ? '' : 's'} · INR
                                    </p>
                                </div>
                                {history.length > 0 && (
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                                            Total
                                        </p>
                                        <p className="text-sm font-semibold text-white font-mono">
                                            {formatINR(totalSpent)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="px-6 py-12 text-center text-neutral-500 text-sm">
                                    No payments yet.
                                </div>
                            ) : (
                                <>
                                    {/* Desktop table */}
                                    <div className="hidden md:block">
                                        <table className="w-full text-sm">
                                            <thead className="text-[10px] uppercase tracking-wider text-neutral-500 bg-white/[0.02]">
                                                <tr>
                                                    <th className="text-left font-medium px-6 py-3">Date</th>
                                                    <th className="text-left font-medium px-6 py-3">Plan</th>
                                                    <th className="text-left font-medium px-6 py-3">Months</th>
                                                    <th className="text-left font-medium px-6 py-3">Payment ID</th>
                                                    <th className="text-left font-medium px-6 py-3">Status</th>
                                                    <th className="text-right font-medium px-6 py-3">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map(h => (
                                                    <tr
                                                        key={h._id || h.razorpayPaymentId}
                                                        className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <td className="px-6 py-3 text-neutral-300 whitespace-nowrap">
                                                            {formatDateTime(h.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-3 text-neutral-200 capitalize">
                                                            {h.plan}
                                                        </td>
                                                        <td className="px-6 py-3 text-neutral-400 font-mono">
                                                            {h.months}
                                                        </td>
                                                        <td className="px-6 py-3 text-neutral-500 font-mono text-xs">
                                                            {h.razorpayPaymentId}
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <HistoryStatusPill status={h.status} />
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-white font-semibold font-mono whitespace-nowrap">
                                                            {formatINR(h.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile cards */}
                                    <div className="md:hidden divide-y divide-white/[0.04]">
                                        {history.map(h => (
                                            <div
                                                key={h._id || h.razorpayPaymentId}
                                                className="px-5 py-4"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="text-sm text-white font-semibold capitalize">
                                                            {h.plan}
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500 mt-0.5">
                                                            {formatDateTime(h.createdAt)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-white font-semibold font-mono">
                                                            {formatINR(h.amount)}
                                                        </p>
                                                        <div className="mt-1">
                                                            <HistoryStatusPill status={h.status} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                                    <span className="font-mono truncate mr-2">
                                                        {h.razorpayPaymentId}
                                                    </span>
                                                    <span className="font-mono">{h.months} mo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="bg-[#0c0c0f] border border-white/[0.06] rounded-2xl p-12 text-center text-neutral-500 text-sm">
                    No billing information found for this project.
                </div>
            )}
        </div>
    )
}
