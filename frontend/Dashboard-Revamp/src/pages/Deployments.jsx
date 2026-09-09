import { timeAgo } from '../utils'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  GitBranch,
  GitCommitHorizontal,
  Search,
  Terminal,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspace } from '../context/WorkspaceContext'
import { useApi } from '../hooks/useApi'
import { normalizeBuild } from '../api/records'
import { EmptyState, LoadState, Modal, PageHeader, StatusBadge } from '../components/ui'

export function LogOutput({ build }) {
  const [state, setState] = useState({ loading: true, text: '', error: '' })
  useEffect(() => {
    const controller = new AbortController()
    if (!build.logsUrl) return
    fetch(build.logsUrl.trim(), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Unable to retrieve build logs.')
        return r.text()
      })
      .then((text) => setState({ loading: false, text, error: '' }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ loading: false, text: '', error: e.message })
      })
    return () => controller.abort()
  }, [build.logsUrl])
  const text = state.text
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${build.projectName || 'deployment'}-logs.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="log-viewer">
      <div className="log-toolbar">
        <span>
          <Terminal size={15} />
          Build output
        </span>
        <div>
          <button
            className="icon-btn"
            disabled={!text}
            aria-label="Copy logs"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text)
                toast.success('Logs copied')
              } catch {
                toast.error('Could not access clipboard')
              }
            }}
          >
            <Copy size={15} />
          </button>
          <button
            className="icon-btn"
            disabled={!text}
            aria-label="Download logs"
            onClick={download}
          >
            <ArrowDownToLine size={15} />
          </button>
        </div>
      </div>
      <pre>
        {!build.logsUrl
          ? 'Logs are not available for this deployment yet.'
          : state.loading
            ? 'Loading build output…'
            : state.error || text || 'No log output yet.'}
      </pre>
    </div>
  )
}

export default function Deployments() {
  const { id } = useParams()
  const { builds, buildsLoading, buildsError, reloadBuilds, projects } = useWorkspace()
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('all'),
    [projectId, setProjectId] = useState('all'),
    [selected, setSelected] = useState(null)
  const scope = id
    ? builds.filter(
        (b) =>
          (b.projectId?._id || b.projectId) === id ||
          b.projectName === projects.find((p) => p._id === id)?.name,
      )
    : builds
  const visible = scope.filter(
    (b) =>
      `${b.projectName} ${b.commitSha} ${b.commitMessage}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === 'all' || (b.buildStatus || b.buildStaus) === status) &&
      (projectId === 'all' || b.projectName === projectId),
  )
  return (
    <>
      <PageHeader
        eyebrow={id ? null : 'FROM COMMIT TO PRODUCTION'}
        title="Deployments"
        description="Every build has a story. Here’s yours."
      >
        <button className="btn" onClick={reloadBuilds}>
          Refresh history
        </button>
      </PageHeader>
      <div className="filter-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search deployments"
            placeholder="Search projects or commits…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="select"
          aria-label="Filter deployment status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="success">Ready</option>
          <option value="building">Building</option>
          <option value="queued">Queued</option>
          <option value="failed">Failed</option>
        </select>
        {!id && (
          <select
            className="select"
            aria-label="Filter deployment project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <LoadState loading={buildsLoading} error={buildsError} retry={reloadBuilds}>
        <div className="panel table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Deployment</th>
                <th>Status</th>
                <th>Source</th>
                <th>Duration</th>
                <th>Created</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b._id}>
                  <td>
                    <button className="deployment-name" onClick={() => setSelected(b)}>
                      <span className="table-icon">
                        <GitBranch size={16} />
                      </span>
                      <span>
                        <strong>{b.projectName || 'Project build'}</strong>
                        <small>{b.commitMessage || 'Deployment'}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <StatusBadge status={b.buildStatus || b.buildStaus} />
                  </td>
                  <td>
                    <div className="source-cell">
                      <span>
                        <GitBranch size={12} />
                        {b.branch || '—'}
                      </span>
                      <small>
                        <GitCommitHorizontal size={12} />
                        {b.commitSha?.slice(0, 7) || 'Manual'}
                      </small>
                    </div>
                  </td>
                  <td className="mono">
                    {b.finishedAt && b.startedAt
                      ? `${Math.max(0, Math.round((new Date(b.finishedAt) - new Date(b.startedAt)) / 1000))}s`
                      : '—'}
                  </td>
                  <td className="muted nowrap">{timeAgo(b.createdAt)}</td>
                  <td>
                    <button className="btn small" onClick={() => setSelected(b)}>
                      View logs
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState
              title="No deployments found"
              description="Try changing your filters, or deploy a project to get started."
            />
          )}
        </div>
        <p className="results-caption">{visible.length} deployments · Newest first</p>
      </LoadState>
      {selected && (
        <Modal
          title={selected.projectName || 'Build logs'}
          description={`${selected.commitSha?.slice(0, 7) || 'Manual deployment'} · ${timeAgo(selected.createdAt)}`}
          wide
          onClose={() => setSelected(null)}
        >
          <LogOutput key={selected._id} build={selected} />
        </Modal>
      )}
    </>
  )
}

export function BuildLogPage() {
  const { buildId, id } = useParams(),
    resource = useApi(`/build/builds/detail/${buildId}`, 'build')
  const build = resource.data ? normalizeBuild(resource.data) : null
  return (
    <>
      <PageHeader title="Build logs" description="A closer look at your deployment." />
      <LoadState loading={resource.loading} error={resource.error} retry={resource.reload}>
        {build && build.projectId === id ? (
          <LogOutput key={build._id} build={build} />
        ) : (
          <EmptyState
            title="Build not found"
            description="This build may have been removed."
            action={
              <Link className="btn" to={`/project/${id}/builds`}>
                Back to deployments
              </Link>
            }
          />
        )}
      </LoadState>
    </>
  )
}
