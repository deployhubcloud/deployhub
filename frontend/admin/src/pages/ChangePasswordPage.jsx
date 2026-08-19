import { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { PageHeader } from '../components/ui'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    setBusy(true)
    try {
      await api.patch('/auth/password', { currentPassword, newPassword })
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Change password"
        subtitle="Update the password you use to log in. OTP will still be sent to your email."
      />

      <form onSubmit={onSubmit} className="card p-5 space-y-4">
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Current password</span>
          <input
            type="password"
            className="input mt-1"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">New password</span>
          <input
            type="password"
            className="input mt-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Confirm new password</span>
          <input
            type="password"
            className="input mt-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button disabled={busy} className="btn btn-primary">
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
