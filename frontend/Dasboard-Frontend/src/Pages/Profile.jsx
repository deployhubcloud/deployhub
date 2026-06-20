import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiclient'

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getInitials(name) {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback
}

export function Profile() {
  const { user, fetchUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    profilePic: '',
    provider: 'local',
  })

  const isGithubUser = formData.provider === 'github'

  useEffect(() => {
    setFormData({
      fullName: user?.fullName || user?.fullname || '',
      email: user?.email || '',
      profilePic: user?.profilePic || '',
      provider: user?.provider || 'local',
    })
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError(null)
    setFormData({
      fullName: user?.fullName || user?.fullname || '',
      email: user?.email || '',
      profilePic: user?.profilePic || '',
      provider: user?.provider || 'local',
    })
  }

  const handleUpdateProfile = async () => {
    const fullName = formData.fullName.trim()

    if (!fullName) {
      setError('Full name is required')
      return
    }

    let accountAge = userData?.createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await api.put('/auth/user/fullname', { fullname: fullName })
      const updatedUser = res.data?.userData

      if (updatedUser) {
        setFormData((prev) => ({
          ...prev,
          fullName: updatedUser.fullName || fullName,
          email: updatedUser.email || prev.email,
          profilePic: updatedUser.profilePic || prev.profilePic,
          provider: updatedUser.provider || prev.provider,
        }))
      }

      await fetchUser()
      setSuccess('Profile identity records updated successfully')
      setIsEditing(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile'))
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (isGithubUser) {
      setError('OAuth profile assets are managed by GitHub directly.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please provide a valid image format template.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image asset boundaries must scale beneath 2MB.')
      return
    }

    const body = new FormData()
    body.append('profilePic', file)

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await api.put('/auth/user/profile-pic', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const updatedUser = res.data?.userData
      if (updatedUser?.profilePic) {
        setFormData((prev) => ({ ...prev, profilePic: updatedUser.profilePic }))
      }

      await fetchUser()
      setSuccess('Profile picture updated successfully')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to upload image'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-2">
      {/* View Title Panel Header */}
      <div>
        <p className="text-[10px] font-extrabold tracking-[0.2em] uppercase mb-1 text-[#c8f135]">
          Identity Core
        </p>
        <h1 className="font-['Outfit'] font-extrabold text-2xl text-white tracking-tight leading-none sm:text-3xl">Profile Settings</h1>
      </div>

      {/* Main Configurations Dashboard Shell */}
      <div className="rounded-2xl p-6 bg-black/10 border border-[#1e1b6e]/30 shadow-xl">

        {/* Status Messaging Systems */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 bg-rose-500/[0.05] border border-rose-500/15 text-rose-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold font-mono tracking-wide">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 bg-emerald-500/[0.05] border border-emerald-500/15 text-emerald-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-bold font-mono tracking-wide">{success}</span>
          </div>
        )}

        {/* Identity Profiler Meta Info Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-[#1e1b6e]/20">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] shadow-inner flex items-center justify-center">
              {formData.profilePic ? (
                <img src={formData.profilePic} alt={formData.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-['Outfit'] font-extrabold text-2xl text-slate-200">
                  {getInitials(formData.fullName)}
                </span>
              )}
            </div>

            {!isGithubUser && (
              <>
                <label
                  htmlFor="profile-pic-upload"
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all bg-[#c8f135] shadow-md shadow-[#c8f135]/10 hover:scale-105 active:scale-95 hover:bg-[#b0d52b]"
                >
                  <svg className="w-4 h-4 text-[#1a2000]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input
                  type="file"
                  id="profile-pic-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="font-['Outfit'] font-extrabold text-xl text-white tracking-tight">
              {formData.fullName || 'Unassigned Identifier'}
            </h2>
            <div className="flex justify-center sm:justify-start">
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-sm border font-mono tracking-wider ${isGithubUser
                ? 'bg-white/[0.04] border-white/[0.05] text-slate-400'
                : 'bg-[#c8f135]/10 border-[#c8f135]/20 text-[#c8f135]'
                }`}>
                {isGithubUser ? 'GITHUB_OAUTH' : 'LOCAL_CLUSTER'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400/50 pt-1">
              Cluster node synchronized {formatDate(user?.createdAt)}
            </p>
            {isGithubUser && (
              <p className="text-[11px] font-medium text-slate-400/60 max-w-sm mt-2.5 bg-black/10 p-2 rounded-lg border border-[#1e1b6e]/20">
                Core structures like names, indices, and profile assets are locked by upstream GitHub validation protocols.
              </p>
            )}
          </div>
        </div>

        {/* Input Profile Forms */}
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-400/40 mb-2">
              Full System Handle
            </label>
            {isEditing && !isGithubUser ? (
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-black/20 text-white border border-[#1e1b6e]/20 focus:border-[#c8f135]/40 transition-all outline-none placeholder:text-slate-600 font-medium"
                placeholder="Declare active full name identity"
                disabled={loading}
              />
            ) : (
              <p className="text-xs font-semibold text-slate-300 bg-white/[0.005] border border-[#1e1b6e]/10 px-4 py-2.5 rounded-xl">{formData.fullName || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-400/40 mb-2">
              Routing Email Endpoint
            </label>
            <p className="text-xs font-mono text-slate-300 bg-white/[0.005] border border-[#1e1b6e]/10 px-4 py-2.5 rounded-xl select-all">{formData.email || '—'}</p>
          </div>

          {/* Action Trigger Block */}
          {!isGithubUser && (
            <div className="flex items-center gap-2.5 pt-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-[#1a2000] bg-[#c8f135] hover:bg-[#b0d52b] active:scale-98 transition-all disabled:opacity-40"
                  >
                    {loading ? 'Committing...' : 'Commit Mutation'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-slate-400 bg-white/[0.02] border border-white/[0.04] hover:text-white transition-all active:scale-98 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setSuccess(null)
                    setIsEditing(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-slate-300 bg-white/[0.01] border border-white/[0.04] hover:text-white hover:border-[#c8f135]/30 hover:bg-[#c8f135]/[0.01] active:scale-98 transition-all group"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#c8f135] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Modify Credentials
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meta Context Analytics Card */}
      <div className="rounded-2xl p-6 bg-black/10 border border-[#1e1b6e]/30 shadow-xl">
        <h2 className="font-['Outfit'] font-extrabold text-base text-white tracking-tight mb-4">Metadata Analysis</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/5 border border-[#1e1b6e]/10 shadow-inner">
            <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400/40 mb-1">
              Active Lifetime Runtime
            </p>
            <p className="font-['Outfit'] text-xl font-extrabold text-white tracking-tight">{accountAge} <span className="text-xs text-slate-500 font-sans font-medium">days</span></p>
          </div>
          <div className="p-4 rounded-xl bg-black/5 border border-[#1e1b6e]/10 shadow-inner">
            <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400/40 mb-1">
              Last State Mutated
            </p>
            <p className="text-xs font-mono font-bold text-slate-300 pt-1">{formatDate(user?.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile