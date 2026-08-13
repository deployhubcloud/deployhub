import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { ConfirmButton, EmptyState, PageHeader, StatusBadge } from '../components/ui'

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admins')
      setAdmins(data.admins || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/admins', form)
      toast.success('Normal admin created')
      setForm({ username: '', email: '', password: '' })
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (id, status) => {
    setBusy(true)
    try {
      await api.patch(`/admins/${id}`, { status })
      toast.success(status === 'active' ? 'Admin enabled' : 'Admin disabled')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    setBusy(true)
    try {
      await api.delete(`/admins/${id}`)
      toast.success('Admin deleted')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins"
        subtitle="Create and manage normal admins. They can view users only; every action is audited."
      />

      <div className="card p-5">
        <div className="font-medium mb-4">Create normal admin</div>
        <form onSubmit={create} className="grid md:grid-cols-4 gap-3 items-end">
          <label className="block text-sm md:col-span-1">
            <span className="text-[var(--muted)]">Username</span>
            <input
              className="input mt-1"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              minLength={3}
            />
          </label>
          <label className="block text-sm md:col-span-1">
            <span className="text-[var(--muted)]">Email</span>
            <input
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm md:col-span-1">
            <span className="text-[var(--muted)]">Password</span>
            <input
              type="password"
              className="input mt-1"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </label>
          <button disabled={busy} className="btn btn-primary w-full">
            {busy ? 'Creating…' : 'Create admin'}
          </button>
        </form>
      </div>

      <div className="table-wrap card !shadow-none overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : admins.length ? (
              admins.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium mono text-sm">{a.username}</td>
                  <td>{a.email}</td>
                  <td>
                    <StatusBadge value={a.status} />
                  </td>
                  <td className="text-xs text-[var(--muted)]">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {a.status === 'active' ? (
                        <button
                          disabled={busy}
                          className="btn btn-warn"
                          onClick={() => setStatus(a.id, 'disabled')}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          className="btn btn-primary"
                          onClick={() => setStatus(a.id, 'active')}
                        >
                          Enable
                        </button>
                      )}
                      <ConfirmButton
                        disabled={busy}
                        label="Delete"
                        confirmText={`Delete normal admin "${a.username}"?`}
                        onConfirm={() => remove(a.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No normal admins yet" text="Create one with username, email, and password." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
