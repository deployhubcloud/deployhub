import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const { login, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginId, setLoginId] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)

  const onCredentials = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const data = await login(username, password)
      setLoginId(data.loginId)
      setStep('otp')
      toast.success('OTP sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const onOtp = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await verifyOtp(loginId, otp)
      toast.success('Welcome back')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-[var(--accent-soft)] border border-[rgba(47,158,108,.3)] grid place-items-center">
            <Shield size={18} className="text-[#7ddeb0]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">DeployHub</div>
            <h1 className="text-2xl font-semibold">Admin Control</h1>
          </div>
        </div>

        <p className="text-sm text-[var(--muted)] mb-6">
          {step === 'credentials'
            ? 'Sign in with username and password. A one-time code will be emailed.'
            : 'Enter the OTP sent to your registered email.'}
        </p>

        {step === 'credentials' ? (
          <form onSubmit={onCredentials} className="space-y-4">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Username</span>
              <input
                className="input mt-1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Password</span>
              <input
                type="password"
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button disabled={busy} className="btn btn-primary w-full">
              {busy ? 'Sending OTP…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={onOtp} className="space-y-4">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">OTP</span>
              <input
                className="input mt-1 mono tracking-[0.35em] text-center text-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </label>
            <button disabled={busy} className="btn btn-primary w-full">
              {busy ? 'Verifying…' : 'Verify & enter'}
            </button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setStep('credentials')}>
              Back
            </button>
          </form>
        )}

        <p className="text-xs text-[var(--muted)] mt-6">
          Session cookie only — ends when the browser closes.
        </p>
      </div>
    </div>
  )
}
