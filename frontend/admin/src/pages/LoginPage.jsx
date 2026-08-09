import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('credentials')
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [loginId, setLoginId] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)

  const onCredentials = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const data = await login(adminId, password)
      setLoginId(data.loginId)
      setStep('otp')
      toast.success('OTP sent to admin email')
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
      toast.success('Welcome, admin')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)]/90 p-8 shadow-2xl">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">DeployHub</div>
          <h1 className="text-3xl font-semibold mt-2">Admin access</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            {step === 'credentials'
              ? 'Sign in with admin ID and password. A one-time code will be emailed.'
              : 'Enter the OTP sent to the registered admin email.'}
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={onCredentials} className="space-y-4">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Admin ID</span>
              <input
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-lg bg-[var(--accent)] text-black font-semibold py-2.5 disabled:opacity-60"
            >
              {busy ? 'Sending OTP…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={onOtp} className="space-y-4">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">OTP</span>
              <input
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 outline-none focus:border-[var(--accent)] mono tracking-[0.3em] text-center text-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-lg bg-[var(--accent)] text-black font-semibold py-2.5 disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Verify & login'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-[var(--muted)]"
              onClick={() => setStep('credentials')}
            >
              Back
            </button>
          </form>
        )}

        <p className="text-xs text-[var(--muted)] mt-6">
          Session cookie only — closes with the browser.
        </p>
      </div>
    </div>
  )
}
