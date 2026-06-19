import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BaseUrl } from '../api/ApiUrl'
import { api } from '../api/apiclient'
import { redirectPathFromState, storeAuthRedirect } from '../routes/authRedirect'

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
)
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const EyeIcon = ({ off }) => off ? (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)
const SpinIcon = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)
const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

function InputField({ label, id, name, type = 'text', value, onChange, placeholder, disabled, icon, rightEl }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[11px] font-bold text-[#666] tracking-widest uppercase">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">{icon}</div>
        <input type={type} id={id} name={name} value={value} onChange={onChange}
          placeholder={placeholder} required disabled={disabled}
          className="w-full pl-11 pr-11 py-3.5 text-sm text-[#1a1a2e] font-medium rounded-2xl bg-white border border-slate-200 focus:border-[var(--indigo-bright)] focus:outline-none focus:ring-4 focus:ring-[#4a3fcf]/5 placeholder:text-slate-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" />
        {rightEl && <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{rightEl}</div>}
      </div>
    </div>
  )
}

function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5">
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span className="text-red-600 text-sm font-medium">{message}</span>
    </div>
  )
}

function OTPBox({ formData, setShowOTP, authRedirectState }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(30)
  const inputRefs = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setCooldown(p => p > 0 ? p - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }
  const handlePaste = (e) => {
    e.preventDefault()
    const chars = e.clipboardData.getData('text').slice(0, 6).split('')
    const next = [...otp]
    chars.forEach((c, i) => { if (/^\d$/.test(c)) next[i] = c })
    setOtp(next)
    inputRefs.current[Math.min(chars.length, 5)]?.focus()
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) { setError('Enter all 6 digits'); return }
    setIsLoading(true); setError('')
    try {
      const res = await api.post('/auth/register/verify', { email: formData.email, otp: code })
      if (res.status === 201) {
        setTimeout(() => navigate('/login', { state: authRedirectState }), 0)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Try again.')
    } finally { setIsLoading(false) }
  }
  const handleResend = async () => {
    setCooldown(30); setError('')
    try { await api.post('/auth/register/init', formData) }
    catch { setError('Failed to resend. Please try again.') }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--indigo-bright)]/5 border border-[var(--indigo-bright)]/10 mx-auto flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-[var(--indigo-bright)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-extrabold text-2xl text-[var(--indigo-deep)] tracking-tight" style={{ fontFamily: 'var(--outfit)' }}>Check your inbox</h3>
        <p className="text-slate-500 text-sm leading-relaxed mt-1">
          We sent a 6-digit signature verification code to<br />
          <span className="text-[var(--indigo-bright)] font-semibold">{formData.email}</span>
        </p>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input key={i} ref={el => inputRefs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste} disabled={isLoading}
              className={`w-12 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 disabled:opacity-50 ${digit ? 'border-[var(--indigo-bright)] text-[var(--indigo-bright)] bg-white shadow-sm' : 'border-slate-200 bg-white text-[var(--indigo-deep)] focus:border-[var(--indigo-bright)]/60'}`} />
          ))}
        </div>
        <button type="submit" disabled={isLoading || otp.join('').length !== 6}
          className="w-full py-4 rounded-2xl bg-[var(--indigo-deep)] text-white font-bold text-sm hover:bg-[var(--indigo-bright)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 shadow-lg shadow-[#1e1b6e]/10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {isLoading ? <><SpinIcon /> Verifying...</> : 'Verify & Complete →'}
        </button>
      </form>
      <div className="text-center space-y-3 pt-2">
        <button onClick={handleResend} disabled={cooldown > 0}
          className={`text-xs font-bold uppercase tracking-wider transition-colors ${cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-[var(--indigo-bright)] hover:underline'}`}>
          {cooldown > 0 ? `Resend Key in ${cooldown}s` : 'Resend Code'}
        </button>
        <button onClick={() => setShowOTP(false)}
          className="block w-full text-xs text-slate-500 font-semibold hover:text-slate-700 transition-colors">
          ← Back to signup registration
        </button>
      </div>
    </div>
  )
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 w-[460px] flex-shrink-0 text-white relative overflow-hidden" style={{ background: 'var(--primary-grad)' }}>
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Synchronized Brand Node Logo */}
      <div className="relative z-10 flex items-center gap-3 font-semibold text-lg tracking-tight">
        <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center">
          <div className="w-3.5 h-3.5 border-2 border-[var(--lime)] border-r-transparent border-b-transparent rounded-full -rotate-45" />
        </div>
        DeployHub
      </div>

      <div className="relative z-10 space-y-10 my-auto">
        <div>
          <h2 className="font-extrabold text-4xl leading-[1.1] tracking-tight mb-4" style={{ fontFamily: 'var(--outfit)' }}>
            Host smarter.<br />Ship <span style={{ fontFamily: 'var(--fraunces)', fontStyle: 'italic', color: 'var(--lime)' }}>faster.</span>
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-[320px]">
            Deploy cluster-managed static builds and runtime instances in real-time. Free forever for developers.
          </p>
        </div>

        {/* Feature System Metric Highlights */}
        <div className="space-y-3">
          {[
            { icon: '⚡', text: 'Deploy environments under 60 seconds' },
            { icon: '🔒', text: 'Automatic SSL provisioned at termination' },
            { icon: '📊', text: 'Granular telemetry and log tracking' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3">
              <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs flex-shrink-0">{item.icon}</div>
              <span className="text-white/90 text-xs font-semibold tracking-wide">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Synchronized Metrics Deck */}
      <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-6">
        {[
          { num: '12.4k+', label: 'Total Serving' },
          { num: '99.9%', label: 'SLA Uptime' },
          { num: '< 8s', label: 'Build Time' }
        ].map(stat => (
          <div key={stat.label}>
            <div className="font-extrabold text-xl text-white">{stat.num}</div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Signup = () => {
  const [formData, setFormData] = useState({ email: '', fullName: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const location = useLocation()
  const redirectTo = redirectPathFromState(location.state)

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleGithubSignup = () => {
    storeAuthRedirect(redirectTo)
    setGithubLoading(true)
    setTimeout(() => {
      window.location.href = `${BaseUrl}/auth/github`
    }, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsLoading(true)
    try {
      const res = await api.post('/auth/register/init', formData)
      if (res.status === 200) setShowOTP(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
    } finally { setIsLoading(false) }
  }

  const anyLoading = isLoading || githubLoading

  return (
    <div className="dh-root min-h-screen flex selection:bg-[#4a3fcf]/10" style={{ background: 'var(--slate-bg)', fontFamily: 'var(--outfit)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;1,700&display=swap');
        
        :root {
          --primary-grad: linear-gradient(135deg, #1e1b6e 0%, #2d27a8 40%, #4a3fcf 70%, #7060ee 100%);
          --indigo-deep: #1e1b6e;
          --indigo-mid: #2d27a8;
          --indigo-bright: #4a3fcf;
          --lime: #c8f135;
          --slate-bg: #f0f2ff;
          --outfit: 'Outfit', sans-serif;
          --fraunces: 'Fraunces', serif;
        }

        @keyframes progress {
          0%{transform:translateX(-100%)}
          100%{transform:translateX(200%)}
        }
      `}</style>

      <LeftPanel />

      <div className="flex-1 flex items-center justify-center px-8 py-12 relative overflow-y-auto">
        <div className="w-full max-w-[360px] relative z-10">

          {anyLoading && (
            <div className="absolute -top-10 left-0 right-0 h-[3px] bg-slate-200/50 overflow-hidden rounded-full">
              <div className="h-full bg-gradient-to-r from-[var(--indigo-bright)] to-[var(--lime)]"
                style={{ animation: 'progress 1.5s cubic-bezier(0.65, 0.05, 0.36, 1) infinite' }} />
            </div>
          )}

          {!showOTP ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="lg:hidden mb-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-grad)' }}>
                  <div className="w-3.5 h-3.5 border-2 border-[var(--lime)] border-r-transparent border-b-transparent rounded-full -rotate-45" />
                </div>
                <h1 className="font-extrabold text-3xl text-[var(--indigo-deep)] tracking-tight">Create account</h1>
                <p className="text-slate-500 text-sm font-medium">Start hosting your projects for free</p>
              </div>

              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={handleGithubSignup}
                disabled={anyLoading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-[var(--indigo-deep)] hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {githubLoading ? (
                  <>
                    <SpinIcon />
                    Redirecting to GitHub...
                  </>
                ) : (
                  <>
                    <GithubIcon />
                    Continue with GitHub
                  </>
                )}
              </button>

              <div className="relative flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">or with email system</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <ErrorAlert message={error} />

              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Account Email" id="email" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="you@example.com" disabled={anyLoading} icon={<EmailIcon />} />

                <InputField label="Full Name" id="fullName" name="fullName"
                  value={formData.fullName} onChange={handleChange}
                  placeholder="John Doe" disabled={anyLoading} icon={<UserIcon />} />

                <InputField label="Account Password" id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  placeholder="Min. 8 characters" disabled={anyLoading} icon={<LockIcon />}
                  rightEl={
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="text-slate-400 hover:text-slate-600 transition-colors">
                      <EyeIcon off={showPass} />
                    </button>
                  } />

                <button type="submit" disabled={anyLoading}
                  className="w-full py-4 rounded-2xl bg-[var(--indigo-deep)] text-white font-bold text-sm mt-2 hover:bg-[var(--indigo-bright)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 shadow-lg shadow-[#1e1b6e]/10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  {isLoading ? <><SpinIcon /> Initializing Registry...</> : 'Create Account →'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" state={location.state} className="text-[var(--indigo-bright)] font-bold hover:underline transition-all">Sign in</Link>
              </p>
              <p className="text-center text-[10px] text-slate-400 font-medium px-4">
                By continuing, you agree to our{' '}
                <a href="#" className="hover:text-slate-600 transition-colors underline">Terms</a>
                {' & '}
                <a href="#" className="hover:text-slate-600 transition-colors underline">Privacy Policy</a>
              </p>
            </div>
          ) : (
            <OTPBox
              formData={formData}
              setShowOTP={setShowOTP}
              authRedirectState={location.state}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Signup