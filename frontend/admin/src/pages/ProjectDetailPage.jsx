import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`)
      setProject(data.project)
      setForm({
        name: data.project.name || '',
        status: data.project.status || '',
        plan: data.project.plan || '',
        branch: data.project.branch || '',
        subdomain: data.project.subdomain || '',
        customDomains: (data.project.customDomains || []).join(', '),
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project')
    }
  }

  useEffect(() => {
    load()
  }, [projectId])

  const save = async () => {
    setBusy(true)
    try {
      const payload = {
        name: form.name,
        status: form.status,
        plan: form.plan,
        branch: form.branch,
        subdomain: form.subdomain || undefined,
        customDomains: form.customDomains
          ? form.customDomains.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
      }
      const { data } = await api.patch(`/projects/${projectId}`, payload)
      setProject(data.project)
      toast.success('Project updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm('Queue full project delete across all services?')) return
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
  }

  if (!project) return <div className="text-[var(--muted)]">Loading project…</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to="/projects" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">← Projects</Link>
        <h1 className="text-3xl font-semibold mt-2">{project.name}</h1>
        <p className="text-[var(--muted)] mono text-xs mt-1">{project._id}</p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 grid md:grid-cols-2 gap-3 text-sm">
        <div><span className="text-[var(--muted)]">Owner:</span>{' '}
          <Link className="text-[var(--accent)]" to={`/users/${project.userId}`}>{String(project.userId)}</Link>
        </div>
        <div><span className="text-[var(--muted)]">Type:</span> {project.type}</div>
        <div><span className="text-[var(--muted)]">Port:</span> {project.assignedPort || project.port || '—'}</div>
        <div><span className="text-[var(--muted)]">Container:</span> <span className="mono text-xs">{project.dockerContainerName || '—'}</span></div>
        <div className="md:col-span-2"><span className="text-[var(--muted)]">Repo:</span> {project.repoUrl}</div>
        <div className="md:col-span-2"><span className="text-[var(--muted)]">Custom domains:</span> {(project.customDomains || []).join(', ') || '—'}</div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 space-y-3">
        <div className="font-medium">Edit project</div>
        {['name', 'status', 'plan', 'branch', 'subdomain'].map((key) => (
          <label key={key} className="block text-sm">
            <span className="text-[var(--muted)] capitalize">{key}</span>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
              value={form[key] || ''}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Custom domains (comma separated)</span>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
            value={form.customDomains || ''}
            onChange={(e) => setForm((f) => ({ ...f, customDomains: e.target.value }))}
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            disabled={busy}
            onClick={save}
            className="rounded-lg bg-[var(--accent)] text-black px-4 py-2 font-medium disabled:opacity-60"
          >
            Save changes
          </button>
          <button
            disabled={busy}
            onClick={remove}
            className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2"
          >
            Delete project
          </button>
        </div>
      </div>
    </div>
  )
}
