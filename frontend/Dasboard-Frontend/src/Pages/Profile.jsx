import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiclient'

// Helpers
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

  // Calculate account age (safe, memoized)
  const accountAge = useMemo(() => {
    if (!user?.createdAt) return 0
    return Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  }, [user])

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
      setSuccess('Profile updated successfully')
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
      setError('GitHub OAuth users cannot change profile picture.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.')
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
      setSuccess('Profile picture updated')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to upload image'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="p-6 max-w-[800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#c2c6d6] mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Identity</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-xs font-semibold">Profile</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#dae2fd]">Profile Settings</h3>
        </div>

        {error && (
          <div className="mb-6 bg-[#93000a]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] px-4 py-2 rounded flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-900/10 border border-green-500/30 text-green-400 px-4 py-2 rounded flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-[#adc6ff]/30 bg-[#0b1326] flex items-center justify-center overflow-hidden">
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt={formData.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[#adc6ff]">
                    {getInitials(formData.fullName)}
                  </span>
                )}
              </div>
              {!isGithubUser && (
                <>
                  <label
                    htmlFor="profile-pic-upload"
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#adc6ff] flex items-center justify-center cursor-pointer hover:bg-[#8cb5f0] transition shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[#00285d] text-[20px]">photo_camera</span>
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

            {/* Info */}
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-semibold text-[#dae2fd]">
                {formData.fullName || 'Unnamed User'}
              </h2>
              <div className="flex justify-center sm:justify-start">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isGithubUser
                    ? 'bg-[#2d3449] text-[#8c909f]'
                    : 'bg-[#adc6ff]/10 text-[#adc6ff]'
                  }`}>
                  {isGithubUser ? 'GitHub OAuth' : 'Local Account'}
                </span>
              </div>
              <p className="text-xs text-[#c2c6d6] opacity-60">
                Joined {formatDate(user?.createdAt)}
              </p>
              {isGithubUser && (
                <p className="text-[11px] text-[#c2c6d6]/50 max-w-xs mt-2 bg-[#0b1326] p-2 rounded border border-[#424754]/50">
                  Name and photo are managed by GitHub. You cannot change them here.
                </p>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">
                Full Name
              </label>
              {isEditing && !isGithubUser ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm text-[#dae2fd] focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                  placeholder="Enter your name"
                  disabled={loading}
                />
              ) : (
                <div className="bg-[#0b1326] border border-[#424754]/50 rounded p-2 text-sm text-[#dae2fd]">
                  {formData.fullName || '—'}
                </div>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">
                Email
              </label>
              <div className="bg-[#0b1326] border border-[#424754]/50 rounded p-2 font-mono text-sm text-[#dae2fd] select-all">
                {formData.email || '—'}
              </div>
            </div>

            {/* Actions */}
            {!isGithubUser && (
              <div className="flex gap-3 pt-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="px-6 py-2 bg-[#adc6ff] text-[#00285d] rounded text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(173,198,255,0.3)] disabled:opacity-50 transition flex items-center gap-2"
                    >
                      {loading ? (
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">save</span>
                      )}
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="px-6 py-2 border border-[#424754] text-[#c2c6d6] rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#222a3d] transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setError(null)
                      setSuccess(null)
                      setIsEditing(true)
                    }}
                    className="px-6 py-2 border border-[#424754] text-[#c2c6d6] rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#222a3d] transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit Name
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Card */}
        <div className="mt-6 bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
          <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#adc6ff]">analytics</span>
            <span className="text-xs font-semibold uppercase tracking-wider">Account Metadata</span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">
                Account Age
              </label>
              <div className="bg-[#0b1326] border border-[#424754]/50 rounded p-2 text-sm text-[#dae2fd]">
                {accountAge} days
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">
                Last Updated
              </label>
              <div className="bg-[#0b1326] border border-[#424754]/50 rounded p-2 text-sm text-[#dae2fd]">
                {formatDate(user?.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Profile