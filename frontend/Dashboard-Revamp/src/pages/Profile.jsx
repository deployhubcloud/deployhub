import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiclient'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/ui/Skeleton'

function getInitials(name) {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback
}

// ── Profile Tab ──────────────────────────────────────────────────────────
function ProfileTab({ user, onUpdate }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.fullname || '',
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <h2 className="font-bold text-slate-900 text-lg">Personal Information</h2>

      {/* Avatar Section */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-emerald-700">
                {getInitials(form.fullName)}
              </span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          {!isGithubUser && (
            <>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900/[0.04] hover:bg-slate-900/[0.08] transition px-4 py-2 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-500 mt-1.5">JPG, PNG or WebP · Max 2MB</p>
            </>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-emerald-500/50 outline-none"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1.5">
            Email
          </label>
          <input
            type="text"
            value={user?.email || ''}
            disabled
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1.5">
            Account Type
          </label>
          <div className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 capitalize">
            {user?.provider === 'github' ? 'GitHub OAuth' : 'Local Account'}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-700 text-xs bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
          {success}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── Security Tab ─────────────────────────────────────────────────────────
function SecurityTab({ user }) {
  return (
    <section className="panel" style={{ padding: 24 }}>
      <h2>Account security</h2>
      <p className="muted" style={{ margin: '12px 0 20px' }}>
        {user?.provider === 'github'
          ? 'You sign in through your GitHub account.'
          : 'You sign in with your email and password.'}{' '}
        Review your active devices and revoke sessions you no longer use.
      </p>
      <Link className="btn primary" to="/settings/sessions">
        Manage active sessions
      </Link>
    </section>
  )
}

export function Profile() {
  const { user, fetchUser } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (user) setPageLoading(false)
  }, [user])

  const TABS = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ]

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <PageHeader section="Account" title="Profile" />
        <div className="grid md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 h-fit">
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit">
          <div className="text-center mb-5">
            <div className="relative inline-block">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-700 text-2xl font-bold flex items-center justify-center border-2 border-emerald-500/20">
                  {getInitials(user?.fullName || user?.fullname)}
                </div>
              )}
            </div>
            <p className="font-bold text-slate-900 mt-3 text-sm">
              {user?.fullName || user?.fullname || 'Unnamed User'}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>

          <nav className="space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-700 hover:bg-slate-900/[0.03]'
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
