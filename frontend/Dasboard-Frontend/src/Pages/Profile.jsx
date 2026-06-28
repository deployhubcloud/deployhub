import { useEffect, useState, useMemo } from 'react'
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

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6 flex gap-6">
        <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="bg-[#111114] border border-white/[0.06] rounded-xl p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function Profile() {
  const { user, fetchUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '', email: '', profilePic: '', provider: 'local',
  })

  const isGithubUser = formData.provider === 'github'

  const accountAge = useMemo(() => {
    if (!user?.createdAt) return 0
    return Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  }, [user])

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user?.fullName || user?.fullname || '',
        email: user?.email || '',
        profilePic: user?.profilePic || '',
        provider: user?.provider || 'local',
      })
      setPageLoading(false)
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
    if (!fullName) { setError('Full name is required'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put('/auth/user/fullname', { fullname: fullName })
      const updatedUser = res.data?.userData
      if (updatedUser) {
        setFormData(prev => ({
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
    if (isGithubUser) { setError('GitHub OAuth users cannot change profile picture.'); return }
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB.'); return }
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
        setFormData(prev => ({ ...prev, profilePic: updatedUser.profilePic }))
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
    <div className="max-w-2xl mx-auto">
      <PageHeader section="Account" title="Profile" />

      {pageLoading ? (
        <ProfileSkeleton />
      ) : (
        <>
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">{success}</div>
          )}

          <div className="bg-[#111114] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border border-white/[0.06] bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
                  {formData.profilePic ? (
                    <img src={formData.profilePic} alt={formData.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-amber-400">{getInitials(formData.fullName)}</span>
                  )}
                </div>
                {!isGithubUser && (
                  <>
                    <label htmlFor="profile-pic-upload"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center cursor-pointer hover:bg-amber-400 transition">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                    <input type="file" id="profile-pic-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
                  </>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold text-white">{formData.fullName || 'Unnamed User'}</h2>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  isGithubUser ? 'bg-white/[0.04] text-neutral-500' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {isGithubUser ? 'GitHub OAuth' : 'Local Account'}
                </span>
                <p className="text-xs text-neutral-500 mt-2">Joined {formatDate(user?.createdAt)}</p>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-4 border-t border-white/[0.06] pt-6">
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Full Name</label>
                {isEditing && !isGithubUser ? (
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none"
                    placeholder="Enter your name" disabled={loading} />
                ) : (
                  <div className="bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-300">
                    {formData.fullName || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-1.5">Email</label>
                <div className="bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-neutral-300">
                  {formData.email || '—'}
                </div>
              </div>
              {!isGithubUser && (
                <div className="flex gap-3 pt-2">
                  {isEditing ? (
                    <>
                      <button onClick={handleUpdateProfile} disabled={loading}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold disabled:opacity-50">
                        {loading ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={handleCancelEdit} disabled={loading}
                        className="px-4 py-2 rounded-lg border border-white/10 text-neutral-400 text-xs font-medium hover:bg-white/5">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setError(null); setSuccess(null); setIsEditing(true) }}
                      className="px-4 py-2 rounded-lg border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5">
                      Edit Name
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-[#111114] border border-white/[0.06] rounded-xl p-6">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Account Metadata</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Account Age</p>
                <p className="text-sm text-white">{accountAge} days</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Last Updated</p>
                <p className="text-sm text-white">{formatDate(user?.updatedAt)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Profile
