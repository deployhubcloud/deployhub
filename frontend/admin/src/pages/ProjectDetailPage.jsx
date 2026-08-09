import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { ConfirmButton, EmptyState, PageHeader, StatusBadge } from '../components/ui'

const TABS = ['overview', 'config', 'domains', 'builds', 'deployments', 'billing', 'redis', 'danger']

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`)
      setData(res.data)
      const p = res.data.project
      setForm({
        name: p.name || '',
        status: p.status || '',
        plan: p.plan || '',
        branch: p.branch || '',
        subdomain: p.subdomain || '',
        repoUrl: p.repoUrl || '',
        buildCommand: p.buildCommand || '',
        startCommand: p.startCommand || '',
        publishDir: p.publishDir || '',
        rootDirectory: p.rootDirectory || '',
        port: p.port || '',
        assignedPort: p.assignedPort || '',
        paymentStatus: p.paymentStatus || '',
        customDomains: (p.customDomains || []).join(', '),
        dockerContainerName: p.dockerContainerName || '',
        dockerImage: p.dockerImage || '',
        networkName: p.networkName || '',
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project')
    }
  }

  useEffect(() => { load() }, [projectId])

  const project = data?.project
  const counts = data?.counts || {}

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const save = async () => {
    setBusy(true)
    try {
      const payload = {
        ...form,
        port: form.port === '' ? undefined : Number(form.port),
        assignedPort: form.assignedPort === '' ? undefined : Number(form.assignedPort),
        customDomains: form.customDomains
          ? form.customDomains.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
      }
      await api.patch(`/projects/${projectId}`, payload)
      toast.success('Project updated')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const run = async (fn, success) => {
    setBusy(true)
    try {
      const res = await fn()
      toast.success(success || res?.data?.message || 'Done')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const redisRows = useMemo(() => {
    if (!data?.redis) return []
    return Object.entries(data.redis)
      .filter(([k]) => k !== 'customDomains')
      .map(([label, info]) => ({ label, ...(info || {}) }))
  }, [data])

  if (!project) return <div className="text-[var(--muted)]">Loading project…</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        subtitle={`${project.type} · ${project.plan} · ${project._id}`}
        actions={
          <>
            <Link to="/projects" className="btn btn-ghost">Back</Link>
            <StatusBadge value={project.status} />
            {data.urls?.public ? (
              <a className="btn btn-ghost" href={data.urls.public} target="_blank" rel="noreferrer">
                Open URL
              </a>
            ) : null}
          </>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <Mini label="Builds" value={counts.builds} />
        <Mini label="Deployments" value={counts.deployments} />
        <Mini label="SSL certs" value={counts.ssl} />
        <Mini label="Paid orders" value={counts.completedOrders} />
        <Mini label="Total builds" value={project.totalBuilds ?? 0} />
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="font-medium mb-4">Infrastructure</div>
            <dl className="kv">
              <dt>Owner</dt>
              <dd>
                {data.owner ? (
                  <Link className="text-[#7ddeb0] hover:underline" to={`/users/${data.owner._id}`}>
                    {data.owner.fullName} ({data.owner.email})
                  </Link>
                ) : (
                  <Link className="text-[#7ddeb0]" to={`/users/${project.userId}`}>{String(project.userId)}</Link>
                )}
              </dd>
              <dt>Repo</dt><dd className="break-all">{project.repoUrl}</dd>
              <dt>Branch</dt><dd>{project.branch}</dd>
              <dt>Container</dt><dd className="mono text-xs">{project.dockerContainerName || '—'}</dd>
              <dt>Container ID</dt><dd className="mono text-xs">{project.containerId || '—'}</dd>
              <dt>Image</dt><dd className="mono text-xs">{project.dockerImage || '—'}</dd>
              <dt>Network</dt><dd className="mono text-xs">{project.networkName}</dd>
              <dt>Ports</dt><dd>app {project.port} · host {project.assignedPort || '—'} · db port {data.port?.port || '—'}</dd>
              <dt>Internal URL</dt><dd className="mono text-xs">{project.internalUrl || '—'}</dd>
              <dt>Microservice</dt><dd>{project.isMicroservice ? 'yes' : 'no'}</dd>
              <dt>Payment</dt><dd>{project.paymentStatus}</dd>
              <dt>Created</dt><dd>{new Date(project.createdAt).toLocaleString()}</dd>
            </dl>
          </div>

          <div className="card p-5">
            <div className="font-medium mb-4">Runtime / monitor / notifications</div>
            <dl className="kv">
              <dt>Monitor</dt>
              <dd>{project.monitor?.enabled ? `on · ${project.monitor.intervalSeconds}s · ${project.monitor.healthPath}` : 'off'}</dd>
              <dt>Email notif</dt><dd>{project.notifications?.email?.enabled ? project.notifications.email.emailAddress : 'off'}</dd>
              <dt>Discord</dt><dd>{project.notifications?.discord?.enabled ? 'on' : 'off'}</dd>
              <dt>Telegram</dt><dd>{project.notifications?.telegram?.enabled ? 'on' : 'off'}</dd>
              <dt>Env keys</dt>
              <dd>{(project.env || []).map((e) => e.key).join(', ') || '—'}</dd>
              <dt>Public URL</dt><dd>{data.urls?.public || '—'}</dd>
            </dl>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="card p-5 space-y-3 max-w-3xl">
          <div className="font-medium">Edit anything</div>
          {[
            'name','status','plan','paymentStatus','branch','repoUrl','subdomain',
            'buildCommand','startCommand','publishDir','rootDirectory','port','assignedPort',
            'dockerContainerName','dockerImage','networkName','customDomains',
          ].map((key) => (
            <label key={key} className="block text-sm">
              <span className="text-[var(--muted)] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input className="input mt-1" value={form[key] ?? ''} onChange={(e) => setField(key, e.target.value)} />
            </label>
          ))}
          <button className="btn btn-primary" disabled={busy} onClick={save}>Save project</button>
        </div>
      )}

      {tab === 'domains' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="font-medium mb-3">Routing</div>
            <dl className="kv">
              <dt>Subdomain</dt><dd className="mono text-xs">{project.subdomain || '—'}</dd>
              <dt>Custom domains</dt><dd>{(project.customDomains || []).join(', ') || '—'}</dd>
              <dt>Public</dt><dd>{data.urls?.public || '—'}</dd>
            </dl>
          </div>
          <div className="card p-5">
            <div className="font-medium mb-3">SSL certificates</div>
            {(data.sslCertificates || []).length ? (
              <div className="space-y-3">
                {data.sslCertificates.map((c) => (
                  <div key={c._id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
                    <div className="font-medium">{c.domain}</div>
                    <div className="text-[var(--muted)] text-xs mt-1">Issued {c.issuedAt} · Expires {c.expiresAt}</div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No SSL records" />}
          </div>
        </div>
      )}

      {tab === 'builds' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ConfirmButton
              disabled={busy}
              label="Delete all builds"
              confirmText="Delete all build records for this project?"
              onConfirm={() => run(() => api.delete(`/projects/${projectId}/builds`), 'Builds deleted')}
            />
          </div>
          <div className="table-wrap card !shadow-none">
            <table className="table">
              <thead>
                <tr><th>Status</th><th>Commit</th><th>Image</th><th>Started</th><th>Logs</th><th></th></tr>
              </thead>
              <tbody>
                {(data.builds || []).length ? data.builds.map((b) => (
                  <tr key={b._id}>
                    <td><StatusBadge value={b.status} /></td>
                    <td className="mono text-xs">{b.commitSha?.slice(0, 8) || '—'}</td>
                    <td className="mono text-xs">{b.dockerImage || '—'}</td>
                    <td className="text-xs text-[var(--muted)]">{b.startedAt ? new Date(b.startedAt).toLocaleString() : '—'}</td>
                    <td>{b.logUrl ? <a className="text-[#7ddeb0]" href={b.logUrl} target="_blank" rel="noreferrer">open</a> : '—'}</td>
                    <td>
                      <ConfirmButton
                        disabled={busy}
                        label="Delete"
                        className="btn btn-danger !py-1 !px-2 text-xs"
                        onConfirm={() => run(() => api.delete(`/projects/builds/${b._id}`), 'Build deleted')}
                      />
                    </td>
                  </tr>
                )) : <tr><td colSpan={6}><EmptyState title="No builds" /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'deployments' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ConfirmButton
              disabled={busy}
              label="Delete all deployments"
              confirmText="Delete all deployment records for this project?"
              onConfirm={() => run(() => api.delete(`/projects/${projectId}/deployments`), 'Deployments deleted')}
            />
          </div>
          <div className="table-wrap card !shadow-none">
            <table className="table">
              <thead>
                <tr><th>Status</th><th>Build</th><th>Container</th><th>Deployed</th><th></th></tr>
              </thead>
              <tbody>
                {(data.deployments || []).length ? data.deployments.map((d) => (
                  <tr key={d._id}>
                    <td><StatusBadge value={d.status} /></td>
                    <td className="mono text-xs">{String(d.build)}</td>
                    <td className="mono text-xs">{d.containerId || '—'}</td>
                    <td className="text-xs text-[var(--muted)]">{d.deployedAt ? new Date(d.deployedAt).toLocaleString() : '—'}</td>
                    <td>
                      <ConfirmButton
                        disabled={busy}
                        label="Delete"
                        className="btn btn-danger !py-1 !px-2 text-xs"
                        onConfirm={() => run(() => api.delete(`/projects/deployments/${d._id}`), 'Deployment deleted')}
                      />
                    </td>
                  </tr>
                )) : <tr><td colSpan={5}><EmptyState title="No deployments" /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Orders title="Completed orders" rows={data.billing?.completedOrders || []} />
          <Orders title="Pending orders" rows={data.billing?.pendingOrders || []} />
        </div>
      )}

      {tab === 'redis' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ConfirmButton
              disabled={busy}
              label="Purge project cache"
              className="btn btn-warn"
              confirmText="Delete Redis keys related to this project?"
              onConfirm={() => run(() => api.post(`/projects/${projectId}/purge-cache`), 'Cache purged')}
            />
          </div>
          <div className="table-wrap card !shadow-none">
            <table className="table">
              <thead>
                <tr><th>Label</th><th>Exists</th><th>Type</th><th>Key / value</th></tr>
              </thead>
              <tbody>
                {redisRows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.exists ? 'yes' : 'no'}</td>
                    <td>{r.type || '—'}</td>
                    <td className="mono text-[11px] text-[var(--muted)] max-w-[420px] truncate">
                      {r.key}
                      {r.value ? ` → ${typeof r.value === 'string' ? r.value : JSON.stringify(r.value)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'danger' && (
        <div className="card p-5 border-[rgba(212,84,84,.35)] space-y-4">
          <div>
            <div className="font-medium text-[#f0a0a0]">Danger zone</div>
            <p className="text-sm text-[var(--muted)] mt-1">
              Full delete queues cleanup across project/build/deploy/monitoring/analytics.
            </p>
          </div>
          <ConfirmButton
            disabled={busy}
            label="Delete entire project"
            confirmText="Queue full platform delete for this project?"
            onConfirm={async () => {
              setBusy(true)
              try {
                await api.delete(`/projects/${projectId}`)
                toast.success('Project delete queued')
                navigate('/projects')
              } catch (err) {
                toast.error(err.response?.data?.message || 'Delete failed')
              } finally {
                setBusy(false)
              }
            }}
          />
        </div>
      )}

      {data.cached ? <p className="text-xs text-[var(--muted)]">Detail served from 1h cache — mutate to refresh</p> : null}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</div>
      <div className="text-xl font-semibold mt-1 tabular-nums">{value ?? 0}</div>
    </div>
  )
}

function Orders({ title, rows }) {
  return (
    <div className="card p-5">
      <div className="font-medium mb-3">{title}</div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={o._id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-medium capitalize">{o.plan || o.status}</span>
                <StatusBadge value={o.status} />
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                ₹{((o.amount || 0) / 100).toFixed(2)} · {o.months || 1} mo · {new Date(o.createdAt).toLocaleString()}
              </div>
              {o.razorpayPaymentId ? <div className="mono text-[11px] mt-1">{o.razorpayPaymentId}</div> : null}
            </div>
          ))}
        </div>
      ) : <EmptyState title="No records" />}
    </div>
  )
}
