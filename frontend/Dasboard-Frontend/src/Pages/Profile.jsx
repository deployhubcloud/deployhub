import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiclient'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/ui/Skeleton'

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback
}

// ── Profile Tab ──────────────────────────────────────────────────────────
function ProfileTab({ user, onUpdate }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.fullname || '',
    phone: user?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isGithubUser = user?.provider === 'github'

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      setError('Full name is required')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await api.put('/auth/user/fullname', { fullname: form.fullName.trim() })
      // phone update API is not available yet – coming soon
      await onUpdate()
      setSuccess('Profile updated')
    } catch (err) {
      setError(getErrorMessage(err, 'Update failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (isGithubUser) {
      setError('GitHub users cannot change avatar.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.')
      return
    }
    const body = new FormData()
    body.append('profilePic', file)
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.put('/auth/user/profile-pic', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await onUpdate()
      setSuccess('Avatar updated')
    } catch (err) {
      setError(getErrorMessage(err, 'Avatar upload failed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6 space-y-6">
      <h2 className="font-bold text-white text-lg">Personal Information</h2>

      {/* Avatar Section */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-white/[0.06] bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-amber-400">{getInitials(form.fullName)}</span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          {!isGithubUser && (
            <>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] transition px-4 py-2 rounded-lg text-xs font-medium text-neutral-300 border border-white/[0.06]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Change Photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <p className="text-[10px] text-neutral-500 mt-1.5">JPG, PNG or WebP · Max 2MB</p>
            </>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
            placeholder="Your full name"
          />
        </div>

        {/* Phone – coming soon */}
        <div>
          <label className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-widest mb-1.5">
            Phone
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Coming soon
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.phone}
              disabled
              className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
              placeholder="+91 9876543210"
            />
            <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-8a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-neutral-600 mt-1">Phone update support will be added soon.</p>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Email</label>
          <input
            type="text"
            value={user?.email || ''}
            disabled
            className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Account Type</label>
          <div className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-300 capitalize">
            {user?.provider === 'github' ? 'GitHub OAuth' : 'Local Account'}
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</div>}
      {success && <div className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">{success}</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── Security Tab ─────────────────────────────────────────────────────────
function SecurityTab({ user }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isGithubUser = user?.provider === 'github'

  if (isGithubUser) {
    return (
      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Password management</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Password changes are not available for GitHub OAuth accounts. Your authentication is managed entirely through GitHub.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/user/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      })
      setSuccess('Password changed successfully!')
      setForm({ oldPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to change password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6 space-y-5">
      <h2 className="font-bold text-white text-lg">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Current Password</label>
          <input
            type="password"
            value={form.oldPassword}
            onChange={e => setForm({ ...form, oldPassword: e.target.value })}
            className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">New Password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={e => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Min 8 characters"
            className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })}
            className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
            required
          />
        </div>
        {error && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</div>}
        {success && <div className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">{success}</div>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

// ── Main Profile Page ─────────────────────────────────────────────────────
export function Profile() {
  const { user, fetchUser } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [tab, setTab] = useState('profile')

  const accountAge = useMemo(() => {
    if (!user?.createdAt) return 0
    return Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  }, [user])

  useEffect(() => {
    if (user) setPageLoading(false)
  }, [user])

  const TABS = [
    { id: 'profile', label: 'Profile', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: 'security', label: 'Security', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
  ]

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <PageHeader section="Account" title="Profile" />
        <div className="grid md:grid-cols-4 gap-6 mt-6">
          <div className="bg-[#111114] rounded-xl p-5 border border-white/[0.06] h-fit">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-3" />
            <Skeleton className="h-4 w-24 mx-auto mb-1" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <PageHeader section="Account" title="Profile" />

      <div className="grid md:grid-cols-4 gap-6 mt-6">
        {/* ── Sidebar ── */}
        <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-5 h-fit">
          <div className="text-center mb-5">
            <div className="relative inline-block">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/20" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-400 text-2xl font-bold flex items-center justify-center border-2 border-amber-500/20">
                  {getInitials(user?.fullName || user?.fullname)}
                </div>
              )}
            </div>
            <p className="font-bold text-white mt-3 text-sm">{user?.fullName || user?.fullname || 'Unnamed User'}</p>
            <p className="text-xs text-neutral-500">{user?.email}</p>
          </div>

          <nav className="space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Content ── */}
        <div className="md:col-span-3">
          {tab === 'profile' && <ProfileTab user={user} onUpdate={fetchUser} />}
          {tab === 'security' && <SecurityTab user={user} />}
        </div>
      </div>
    </div>
  )
}

export default Profile