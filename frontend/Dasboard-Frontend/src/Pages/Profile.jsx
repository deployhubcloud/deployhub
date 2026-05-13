import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiclient'

function formatDate(dateString) {
  if (!dateString) return '-'

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
      setError('GitHub profile picture is managed by GitHub')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB')
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

  const accountAge = user?.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="space-y-6">
      <div>
        <p className="text-xs font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: '#00e5ff' }}>
          Account
        </p>
        <h1 className="font-syne font-black text-[28px] text-white leading-none">Profile Settings</h1>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {error && (
          <div
            className="mb-4 p-3 rounded-lg flex items-center gap-2"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm" style={{ color: '#f87171' }}>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="mb-4 p-3 rounded-lg flex items-center gap-2"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm" style={{ color: '#34d399' }}>{success}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(0,184,204,0.1))',
                border: '2px solid rgba(0,229,255,0.2)',
              }}
            >
              {formData.profilePic ? (
                <img src={formData.profilePic} alt={formData.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-syne font-black text-2xl" style={{ color: '#00e5ff' }}>
                    {getInitials(formData.fullName)}
                  </span>
                </div>
              )}
            </div>

            {!isGithubUser && (
              <>
                <label
                  htmlFor="profile-pic-upload"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                  style={{ background: '#00e5ff', boxShadow: '0 4px 12px rgba(0,229,255,0.3)' }}
                >
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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

          <div>
            <h2 className="font-syne font-black text-xl text-white mb-1">
              {formData.fullName || 'User'}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(156,163,175,0.08)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156,163,175,0.2)',
                }}
              >
                {isGithubUser ? 'GitHub' : 'Local'}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Member since {formatDate(user?.createdAt)}
            </p>
            {isGithubUser && (
              <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                Name, email, and profile picture are managed by GitHub.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-[0.1em] uppercase mb-2" style={{ color: '#9ca3af' }}>
              Full Name
            </label>
            {isEditing && !isGithubUser ? (
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl text-sm text-white"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  outline: 'none',
                }}
                placeholder="Enter your full name"
                disabled={loading}
              />
            ) : (
              <p className="text-sm text-white py-3">{formData.fullName || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold tracking-[0.1em] uppercase mb-2" style={{ color: '#9ca3af' }}>
              Email Address
            </label>
            <p className="text-sm text-white py-3">{formData.email || '-'}</p>
          </div>

          {!isGithubUser && (
            <div className="flex items-center gap-3 pt-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      background: 'linear-gradient(135deg, #00e5ff, #00b8cc)',
                      boxShadow: '0 4px 16px rgba(0,229,255,0.2)',
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#9ca3af',
                    }}
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="font-syne font-bold text-lg text-white mb-4">Account Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs font-bold tracking-[0.1em] uppercase mb-1" style={{ color: '#9ca3af' }}>
              Account Age
            </p>
            <p className="text-lg font-syne font-bold text-white">{accountAge} days</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs font-bold tracking-[0.1em] uppercase mb-1" style={{ color: '#9ca3af' }}>
              Last Updated
            </p>
            <p className="text-sm font-syne font-bold text-white">{formatDate(user?.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
