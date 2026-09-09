import Github from '../components/Github'
import { timeAgo } from '../utils'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import {
  Activity,
  ArrowUpRight,
  Box,
  Copy,
  GitBranch,
  Globe,
  Play,
  Rocket,
  Terminal,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { useWorkspace } from '../context/WorkspaceContext'
import { api } from '../api/apiclient'
import { WS_URL } from '../api/ApiUrl'
import { EmptyState, LoadState, Modal, PageHeader, StatusBadge } from '../components/ui'

export function ProjectOverview() {
  const { id } = useParams(),
    resource = useApi(`/project/overview/${id}`, 'data'),
    { reload, reloadBuilds, builds, projects } = useWorkspace()
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false)
  const project = resource.data
  const currentStatus =
    projects.find((item) => item._id === id)?.status || project?.stats || project?.status
  const domain = project?.isMicroservice
    ? project.internalUrl
    : Array.isArray(project?.domain)
      ? project.domain[0]
      : project?.domain
  const latest = project?.latestBuildData || builds.find((b) => b.projectId === id)
  async function redeploy() {
    setBusy(true)
    try {
      await api.post(`/project/redeploy/${id}`)
      toast.success('Deployment queued')
      setConfirm(false)
      resource.reload()
      reload()
      reloadBuilds()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start deployment')
    } finally {
      setBusy(false)
    }
  }
  return (
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload}>
      <PageHeader
        title="Production overview"
        description="Everything you need to keep this project moving."
      >
        <button className="btn primary" onClick={() => setConfirm(true)}>
          <Rocket size={16} />
          Redeploy
        </button>
      </PageHeader>
      {project && (
        <>
          <div className="production-grid">
            <section className="panel production-card">
              <div className="production-preview">
                <div className="preview-browser">
                  <i />
                  <i />
                  <i />
                  <span>{domain || 'Your project'}</span>
                </div>
                <div className="preview-body">
                  <Box size={35} />
                  <h2>{project.name}</h2>
                  <p>{domain || 'No deployment address assigned'}</p>
                  <StatusBadge status={currentStatus} />
                </div>
              </div>
              <div className="production-caption">
                <span>Production deployment</span>
                <Link to={`/project/${id}/logs`}>
                  Inspect logs
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </section>
            <section className="panel project-facts">
              <h2>Deployment details</h2>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge status={currentStatus} />
                  </dd>
                </div>
                <div>
                  <dt>{project.isMicroservice ? 'Internal address' : 'Domain'}</dt>
                  <dd>
                    {domain ? (
                      project.isMicroservice ? (
                        <span>{domain}</span>
                      ) : (
                        <a
                          href={domain.startsWith('http') ? domain : `https://${domain}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {domain}
                          <ArrowUpRight size={13} />
                        </a>
                      )
                    ) : (
                      'Awaiting deployment'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>
                    <Github size={14} />
                    {project.repoUrl?.split('/').slice(-2).join('/') || 'Git repository'}
                  </dd>
                </div>
                <div>
                  <dt>Branch</dt>
                  <dd>
                    <GitBranch size={14} />
                    {project.branch || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{timeAgo(project.updatedAt || latest?.createdAt)}</dd>
                </div>
                <div>
                  <dt>Runtime</dt>
                  <dd>
                    {project.type || 'Configured runtime'} {project.version}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
          <div className="section-heading">
            <div>
              <h2>Make yourself at home.</h2>
              <p>Your project’s essentials, one click away.</p>
            </div>
          </div>
          <div className="projects-grid">
            {[
              ['logs', Terminal, 'Follow the logs', 'Inspect runtime output as it happens.'],
              [
                'metrics',
                Activity,
                'See the bigger picture',
                'Understand your traffic and visitors.',
              ],
              ['domains', Globe, 'Give it a good address', 'Connect a domain that feels like you.'],
            ].map(([path, Icon, title, desc]) => (
              <Link className="panel detail-shortcut" key={path} to={`/project/${id}/${path}`}>
                <span className="shortcut-icon">
                  <Icon size={22} />
                </span>
                <h3>
                  {title}
                  <ArrowUpRight size={16} />
                </h3>
                <p>{desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
      {confirm && (
        <Modal
          title="Ready for a fresh deployment?"
          description={`This will build and deploy ${project?.name} from its configured repository and branch.`}
          onClose={() => {
            if (!busy) setConfirm(false)
          }}
        >
          <div className="modal-actions">
            <button className="btn" disabled={busy} onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button className="btn primary" disabled={busy} onClick={redeploy}>
              <Rocket size={16} />
              {busy ? 'Queuing…' : 'Redeploy project'}
            </button>
          </div>
        </Modal>
      )}
    </LoadState>
  )
}

export function ProjectMetrics() {
  const { id } = useParams(),
    { data, loading, error, reload } = useApi(`/analytics/summary/${id}`, 'data')
  const requests = data?.requests || {},
    errors = data?.errors || data?.error || {}
  const rows = [
    { label: 'Last 5 minutes', value: requests.last5m || 0 },
    { label: 'Last hour', value: requests.last1h || 0 },
    { label: 'Last 24 hours', value: requests.last24h || 0 },
  ]
  return (
    <>
      <PageHeader
        title="Project analytics"
        description="A window into the people and requests behind your project."
      >
        <button className="btn" onClick={reload}>
          Refresh metrics
        </button>
      </PageHeader>
      <LoadState loading={loading} error={error} retry={reload}>
        <div className="stats-grid">
          {[...rows, { label: 'Unique visitors · 24h', value: data?.uniqueVisitors || 0 }].map(
            (r) => (
              <section className="stat-card" key={r.label}>
                <div className="stat-label">
                  {r.label}
                  <Activity size={15} />
                </div>
                <div className="stat-value">{Number(r.value).toLocaleString()}</div>
                <span className="stat-note">
                  {r.label.includes('visitors')
                    ? 'People visiting your project'
                    : 'Requests served'}
                </span>
              </section>
            ),
          )}
        </div>
        <div className="analytics-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Request volume</h2>
                <p>Compare recent traffic windows.</p>
              </div>
            </div>
            <div className="metrics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ left: -10, right: 24 }}>
                  <CartesianGrid vertical={false} stroke="var(--theme-line)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--theme-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--theme-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--theme-subtle)' }}
                    contentStyle={{ border: '1px solid var(--theme-line)', borderRadius: 10 }}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="value"
                    name="Requests"
                    fill="var(--theme-accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={65}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Top countries</h2>
                <p>Where your visitors call home.</p>
              </div>
            </div>
            <div className="country-list">
              {data?.topCountries?.map(({ country, count }) => (
                <div key={country}>
                  <div>
                    <strong>{country}</strong>
                    <span>{Number(count).toLocaleString()}</span>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${(count / Math.max(...data.topCountries.map((c) => c.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {!data?.topCountries?.length && <p className="muted">No geographic data yet.</p>}
            </div>
          </section>
        </div>
        <div className="analytics-grid">
          <section className="panel">
            <div className="panel-heading">
              <h2>Errors · last 5 minutes</h2>
            </div>
            <div className="error-metrics">
              <div>
                <span>4xx · Client errors</span>
                <strong>{errors['4xx'] || 0}</strong>
              </div>
              <div>
                <span>5xx · Server errors</span>
                <strong>{errors['5xx'] || 0}</strong>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Popular endpoints · 24h</h2>
            </div>
            <div className="endpoint-list">
              {data?.topEndpoints?.map((e, i) => (
                <div key={e.path || e.endpoint || i}>
                  <code>{e.path || e.endpoint || '/'}</code>
                  <span>{Number(e.count || 0).toLocaleString()} requests</span>
                </div>
              ))}
              {!data?.topEndpoints?.length && <p className="muted">No request data yet.</p>}
            </div>
          </section>
        </div>
      </LoadState>
    </>
  )
}

export function ProjectLogs() {
  const { id } = useParams()
  const [logs, setLogs] = useState([]),
    [connected, setConnected] = useState(false),
    [paused, setPaused] = useState(false),
    [query, setQuery] = useState('')
  useEffect(() => {
    if (paused) return
    let active = true
    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })
    socket.on('connect', () => {
      setConnected(true)
      socket.emit('subscribe_logs', { projectId: id })
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))
    socket.on('build_log', async (event) => {
      if (event.projectId !== id) return
      if (event.type === 'reset') {
        setLogs([])
        return
      }
      if (event.type === 'static_project' && event.logsUrl) {
        try {
          const response = await fetch(event.logsUrl)
          if (!response.ok) throw new Error()
          const text = await response.text()
          if (active) setLogs(text.split('\n'))
        } catch {
          if (active) setLogs(['Unable to retrieve static build logs.'])
        }
        return
      }
      if (event.log || event.message)
        setLogs((previous) => [...previous.slice(-1999), event.log || event.message])
    })
    return () => {
      active = false
      socket.emit('unsubscribe_logs', { projectId: id })
      socket.disconnect()
    }
  }, [id, paused])
  const visible = logs.filter((line) => line.toLowerCase().includes(query.toLowerCase()))
  return (
    <>
      <PageHeader
        title="Runtime logs"
        description="Stay close to what’s happening inside your project."
      >
        <span className={`status ${connected && !paused ? 'positive' : 'pending'}`}>
          <span className="status-dot" />
          {paused ? 'Paused' : connected ? 'Connected' : 'Disconnected'}
        </span>
        <button className="btn" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume stream' : 'Pause stream'}
        </button>
      </PageHeader>
      <div className="filter-toolbar">
        <div className="search-field">
          <Terminal size={16} />
          <input
            aria-label="Filter log output"
            placeholder="Filter log output…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn" onClick={() => setLogs([])}>
          Clear view
        </button>
      </div>
      <div className="log-viewer runtime-logs">
        <div className="log-toolbar">
          <span>
            <Terminal size={15} />
            Runtime output
          </span>
          <span>{visible.length} lines</span>
        </div>
        <div className="numbered-logs" role="log" aria-live={paused ? 'off' : 'polite'}>
          {visible.map((line, i) => (
            <div key={i}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <code
                className={
                  line.includes('ERROR')
                    ? 'log-error'
                    : line.includes('SUCCESS')
                      ? 'log-success'
                      : ''
                }
              >
                {line}
              </code>
            </div>
          ))}
          {!visible.length && (
            <p>
              {query
                ? 'No logs match your filter.'
                : 'Waiting for log output. Check that your project and stream service are running.'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
