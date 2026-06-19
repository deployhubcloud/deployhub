import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BaseUrl } from '../api/ApiUrl'
import { redirectPathFromState, storeAuthRedirect } from '../routes/authRedirect'

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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
            Welcome<br />back to <span style={{ fontFamily: 'var(--fraunces)', fontStyle: 'italic', color: 'var(--lime)' }}>production.</span>
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-[320px]">
            Your operational workspace cluster is online. Authenticate into your dashboard node to monitor servers and active metrics.
          </p>
        </div>

        {/* High-Fidelity App Rows Mirroring the Home Mockup */}
        <div className="space-y-3">
          {[
            { name: 'ecommerce-api', status: 'Live', time: '2m ago', dotStyle: 'background: #28c840; box-shadow: 0 0 6px #28c840;' },
            { name: 'auth-service', status: 'Running', time: '7d ago', dotStyle: 'background: #5ba4ff; box-shadow: 0 0 6px #5ba4ff;' },
            { name: 'dashboard-v3', status: 'Building', time: 'building...', dotStyle: 'background: #ffbd2e; box-shadow: 0 0 6px #ffbd2e;' },
          ].map(item => (
            <div key={item.name} className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ fallback: 'white', style: item.dotStyle }} />
                <span className="text-white text-xs font-semibold tracking-wide font-mono">{item.name}</span>
              </div>
              <span className="text-[11px] text-white/50 font-medium font-mono">{item.time}</span>
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

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)

  const { login } = useAuth()
  const location = useLocation()
  const redirectTo = redirectPathFromState(location.state)

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleGithubLogin = () => {
    storeAuthRedirect(redirectTo)
    setGithubLoading(true)
    setTimeout(() => {
      window.location.href = `${BaseUrl}/auth/github`
    }, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(formData.email, formData.password, redirectTo)
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
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
          --lime-dark: #1a2000;
          --slate-bg: #f0f2ff;
          --panel-dark: rgba(12, 10, 42, 0.92);
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

          <div className="space-y-6">
            <div className="space-y-1">
              <div className="lg:hidden mb-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-grad)' }}>
                <div className="w-3.5 h-3.5 border-2 border-[var(--lime)] border-r-transparent border-b-transparent rounded-full -rotate-45" />
              </div>
              <h1 className="font-extrabold text-3xl text-[var(--indigo-deep)] tracking-tight">Sign In</h1>
              <p className="text-slate-500 text-sm font-medium">Welcome back to DeployHub control deck</p>
            </div>

            {/* Premium GitHub Login Button matching outline system */}
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-[var(--indigo-deep)] hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {githubLoading ? (
                <>
                  <SpinIcon />
                  Connecting network node...
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
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">or secure signature credential</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <ErrorAlert message={error} />

            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Account Email"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@deployhub.io"
                disabled={anyLoading}
                icon={<EmailIcon />}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password"
                    className="block text-[11px] font-bold text-[#666] tracking-widest uppercase">
                    Account Password
                  </label>
                  <a href="#"
                    className="text-xs text-[var(--indigo-bright)] hover:underline transition-all font-semibold">
                    Forgot Key?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <LockIcon />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    required
                    disabled={anyLoading}
                    className="w-full pl-11 pr-11 py-3.5 text-sm text-[#1a1a2e] font-medium rounded-2xl bg-white border border-slate-200 focus:border-[var(--indigo-bright)] focus:outline-none focus:ring-4 focus:ring-[#4a3fcf]/5 placeholder:text-slate-400/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="text-slate-400 hover:text-slate-600 transition-colors">
                      <EyeIcon off={showPass} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Submit Button styled precisely like .btn-primary-lime / primary dark action blocks */}
              <button
                type="submit"
                disabled={anyLoading}
                className="w-full py-4 rounded-2xl bg-[var(--indigo-deep)] text-white font-bold text-sm mt-2 hover:bg-[var(--indigo-bright)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 shadow-lg shadow-[#1e1b6e]/10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {isLoading ? <><SpinIcon /> Syncing Instance...</> : 'Authenticate Deck →'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup"
                state={location.state}
                className="text-[var(--indigo-bright)] font-bold hover:underline transition-all">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login