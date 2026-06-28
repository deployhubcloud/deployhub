import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/apiclient'
import PageHeader from '../../components/PageHeader'
import Skeleton from '../../components/ui/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts'

const AMBER = '#f5a623'

function StatCard({ label, value, sub, trend }) {
  return (
    <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
      <p className="text-3xl font-semibold text-white tabular-nums">{Number(value).toLocaleString()}</p>
      <p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">{label}</p>
      {sub && (
        <p className={`text-xs mt-1 ${trend ? 'text-amber-400' : 'text-neutral-600'}`}>{sub}</p>
      )}
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#111114] border border-white/[0.06] rounded-xl p-5">
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#111114',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '8px',
  color: '#fafafa',
  fontSize: 12,
}

export function Metrics() {
  const { id } = useParams()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get(`/analytics/summary/${id}`)
        setSummary(response.data.data)
      } catch (err) {
        setError(err.message || 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader section="Project" title="Metrics" />
        <MetricsSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader section="Project" title="Metrics" />
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!summary) return null

  const errData = summary.errors || summary.error || { '4xx': 0, '5xx': 0 }
  const requestChartData = [
    { name: '5m', value: summary.requests.last5m },
    { name: '1h', value: summary.requests.last1h },
    { name: '24h', value: summary.requests.last24h },
  ]
  const totalErrors = errData['4xx'] + errData['5xx']

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader section="Project" title="Metrics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Last 5 min" value={summary.requests.last5m} sub="requests" trend />
        <StatCard label="Last 1 hour" value={summary.requests.last1h} sub="requests" />
        <StatCard label="Last 24 hours" value={summary.requests.last24h} sub="requests" />
        <StatCard label="Unique Visitors" value={summary.uniqueVisitors} sub="last 24h" trend />
      </div>

      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-6">Request Volume</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={requestChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(val) => [val.toLocaleString(), 'Requests']} />
            <Bar dataKey="value" fill={AMBER} radius={[4, 4, 0, 0]} barSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Errors (Last 5 min)</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-neutral-400">4xx Client Errors</span>
              </div>
              <span className="text-2xl font-semibold text-white tabular-nums">{errData['4xx']}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-neutral-400">5xx Server Errors</span>
              </div>
              <span className="text-2xl font-semibold text-white tabular-nums">{errData['5xx']}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-neutral-500">Total</span>
              <span className="text-lg font-medium text-neutral-300 tabular-nums">{totalErrors.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Top Countries (24h)</h2>
          {!summary.topCountries?.length ? (
            <p className="text-sm text-neutral-600">No data yet</p>
          ) : (
            <div className="space-y-3">
              {summary.topCountries.map(({ country, count }) => {
                const max = summary.topCountries[0].count
                return (
                  <div key={country}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-mono text-neutral-300">{country === 'unknown' ? '??' : country}</span>
                      <span className="text-neutral-500 tabular-nums">{count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-1">
                      <div className="bg-amber-500 h-1 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Top Endpoints (24h)</h2>
        {!summary.topEndpoints?.length ? (
          <p className="text-sm text-neutral-600">No data yet</p>
        ) : (
          <div className="space-y-3">
            {summary.topEndpoints.map(({ path, count }) => {
              const max = summary.topEndpoints[0].count
              return (
                <div key={path} className="flex items-center gap-4">
                  <span className="font-mono text-sm text-neutral-300 truncate flex-1">{path}</span>
                  <div className="w-24 bg-white/[0.04] rounded-full h-1 hidden sm:block">
                    <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400 tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
