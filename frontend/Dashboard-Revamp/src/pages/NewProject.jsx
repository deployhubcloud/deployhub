import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Link, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiclient'
import { useApi } from '../hooks/useApi'
import { normalizePlans } from '../api/plans'
import { EmptyState, LoadState } from '../components/ui'

const TYPE_LABELS = {
  static: 'Static',
  node: 'Node.js',
  go: 'Go',
  python: 'Python',
  java: 'Java',
}

const RUNTIME_VERSIONS = {
  static: { label: 'Node.js (build)', versions: ['22', '24'], default: '24' },
  node: { label: 'Node.js', versions: ['22', '24'], default: '24' },
  go: { label: 'Go', versions: ['1.21', '1.22', '1.23'], default: '1.22' },
  python: { label: 'Python', versions: ['3.10', '3.11', '3.12'], default: '3.11' },
  java: { label: 'Java', versions: ['17', '21'], default: '21' },
}

const MONTHS = [1, 3, 6, 12]
const REPO_PAGE_SIZE = 12

const STEPS = [
  { id: 0, title: 'Plan & Billing', desc: 'Pick a tier and term' },
  { id: 1, title: 'Project & Runtime', desc: 'Name and runtime version' },
  { id: 2, title: 'Repository', desc: 'Connect your source' },
  { id: 3, title: 'Build & Deploy', desc: 'Commands, port, env' },
  { id: 4, title: 'Notifications & Review', desc: 'Alerts and confirm' },
]

function useRazorpay() {
  const [loaded, setLoaded] = useState(() => Boolean(window.Razorpay))
  useEffect(() => {
    if (loaded) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setLoaded(true)
    document.body.appendChild(script)
    return () => (script.onload = null)
  }, [loaded])
  return loaded
}

function parseEnv(envText) {
  if (!envText.trim()) return undefined
  return envText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const separator = line.indexOf('=')
      if (separator > 0) {
        acc[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
      }
      return acc
    }, {})
}

function buildPayload(form, plan, months, projectType, selectedRepo) {
  const env = parseEnv(form.envText)
  const isStatic = projectType === 'static'
  const isMicroservice = isStatic ? false : form.isMicroservice
  const payload = {
    plan,
    months,
    projectName: form.projectName.trim(),
    projectType,
    version: form.runtimeVersion,
    isMicroservice,
    repoUrl: form.repoUrl.trim(),
    branch: form.branch.trim(),
    rootDirectory: form.rootDirectory.trim() || '.',
    subdomain: isMicroservice ? undefined : form.subdomain.trim() || undefined,
    env: env && Object.keys(env).length ? env : undefined,
    notifications: {
      email: {
        enabled: form.emailNotifications,
        emailAddress: form.notificationEmail.trim() || undefined,
      },
      discord: {
        enabled: form.discordNotifications,
        webhookUrl: form.discordWebhookUrl.trim() || undefined,
      },
      telegram: {
        enabled: form.telegramNotifications,
        botToken: form.telegramBotToken.trim() || undefined,
        chatId: form.telegramChatId.trim() || undefined,
      },
    },
    monitor: {
      enabled: form.monitorEnabled,
      healthPath: form.healthPath.trim() || '/health',
    },
    ...(isStatic
      ? {
          buildCommand: form.buildCommand.trim(),
          publishDir: form.publishDir.trim(),
        }
      : {
          startCommand: form.startCommand.trim(),
          port: Number(form.port),
        }),
  }

  if (selectedRepo) {
    payload.repoMetadata = {
      id: selectedRepo.id,
      fullName: selectedRepo.full_name,
      private: selectedRepo.private,
      htmlUrl: selectedRepo.html_url,
      description: selectedRepo.description,
      defaultBranch: selectedRepo.default_branch,
    }
  }
  return payload
}

const cx = (...c) => c.filter(Boolean).join(' ')

const inputClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-neutral-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition'

const monoInputClass = inputClass + ' font-mono'

function Field({ label, htmlFor, hint, error, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
          {label}
          {required && <span className="ml-1 text-emerald-700">*</span>}
        </span>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </label>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-slate-200"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {description && <div className="mt-0.5 text-xs text-slate-600">{description}</div>}
      </div>
      <span
        className={cx(
          'theme-switch-track relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition',
          checked ? 'bg-emerald-500' : 'bg-slate-900/10',
        )}
      >
        <span
          className={cx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

function StepIndicator({ step, setStep, validateStep, completed }) {
  return (
    <>
      <div className="lg:hidden">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium text-slate-900">
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step].title}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="hidden lg:block">
        {STEPS.map((s, idx) => {
          const isCurrent = idx === step
          const isDone = completed.includes(idx)
          const reachable = isDone || idx <= step
          return (
            <li key={s.id} className="relative pb-6 last:pb-0">
              {idx < STEPS.length - 1 && (
                <span
                  className={cx(
                    'absolute left-[15px] top-8 h-full w-px',
                    isDone ? 'bg-emerald-500/60' : 'bg-slate-900/10',
                  )}
                />
              )}
              <button
                type="button"
                disabled={!reachable}
                onClick={() => {
                  if (idx <= step) setStep(idx)
                  else if (idx === step + 1 && validateStep(step)) setStep(idx)
                }}
                className={cx(
                  'group relative flex w-full items-start gap-3 text-left transition disabled:cursor-not-allowed',
                  reachable ? 'opacity-100' : 'opacity-50',
                )}
              >
                <span
                  className={cx(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition',
                    isDone
                      ? 'border-emerald-500 bg-emerald-600 text-slate-900'
                      : isCurrent
                        ? 'border-emerald-500 bg-white text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  {isDone ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span
                    className={cx(
                      'block text-sm font-medium',
                      isCurrent ? 'text-slate-900' : 'text-slate-700',
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="block text-xs text-slate-500">{s.desc}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}

export default function NewProject() {
  const { type = 'static' } = useParams()
  const resource = useApi('/project/plans', 'plans')
  const plans = normalizePlans(resource.data)
  const supported = Object.values(plans).some((plan) => plan.types.includes(type.toLowerCase()))
  if (!TYPE_LABELS[type.toLowerCase()]) return <Navigate to="/projects/new" replace />
  return (
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload}>
      {supported ? (
        <NewProjectForm key={type} plans={plans} />
      ) : (
        <EmptyState
          title="No plans available for this runtime"
          description="The current plan catalog does not offer this runtime. Reload the catalog or choose another project type."
          action={
            <button className="btn" onClick={resource.reload}>
              Reload plans
            </button>
          }
        />
      )}
    </LoadState>
  )
}

function NewProjectForm({ plans }) {
  const { type = 'static' } = useParams()
  const { user } = useAuth()
  const razorpayLoaded = useRazorpay()
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
  const normalizedType = type.toLowerCase()
  const selectedType = TYPE_LABELS[normalizedType] ? normalizedType : 'static'
  const defaultPlan = Object.keys(plans)
    .filter((id) => plans[id].types.includes(selectedType))
    .sort((a, b) => plans[a].price - plans[b].price)[0]

  const navigate = useNavigate()

  const [plan, setPlan] = useState(defaultPlan)
  const [months, setMonths] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [repoError, setRepoError] = useState('')
  const [created, setCreated] = useState(null)
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [useManualRepo, setUseManualRepo] = useState(false)
  const [repoQuery, setRepoQuery] = useState('')
  const [visibleRepoCount, setVisibleRepoCount] = useState(REPO_PAGE_SIZE)
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState([])
  const [stepErrors, setStepErrors] = useState({})
  const topRef = useRef(null)

  // NEW: states for redirect overlay
  const [redirecting, setRedirecting] = useState(false)
  const [countdown, setCountdown] = useState(2)

  const [form, setForm] = useState({
    projectName: '',
    repoUrl: '',
    branch: 'main',
    rootDirectory: '.',
    runtimeVersion: RUNTIME_VERSIONS[selectedType].default,
    isMicroservice: false,
    subdomain: '',
    buildCommand: 'npm run build',
    publishDir: 'dist',
    startCommand: 'npm start',
    port: '3000',
    envText: '',
    monitorEnabled: false,
    healthPath: '/health',
    emailNotifications: false,
    notificationEmail: user?.email || '',
    discordNotifications: false,
    discordWebhookUrl: '',
    telegramNotifications: false,
    telegramBotToken: '',
    telegramChatId: '',
  })

  /* ---------------- effects ---------------- */

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      runtimeVersion: RUNTIME_VERSIONS[selectedType].default,
    }))
  }, [selectedType])

  useEffect(() => {
    const fetchRepos = async () => {
      if (!user || user.provider !== 'github') return
      setLoadingRepos(true)
      setRepoError('')
      try {
        const response = await api.get('/auth/user/repos')
        setRepos(response.data.repositories || [])
      } catch (err) {
        console.error('Failed to fetch repos', err)
        setRepoError(
          'Could not load your GitHub repositories. You can still enter a repository URL manually.',
        )
        setUseManualRepo(true)
      } finally {
        setLoadingRepos(false)
      }
    }
    fetchRepos()
  }, [user])

  // UPDATED: redirect with countdown overlay
  useEffect(() => {
    let timer
    if (created) {
      const projectId = created.projectId || created?.project?._id
      if (projectId) {
        setRedirecting(true)
        setCountdown(2)
        timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              navigate(`/project/${projectId}/logs`)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [created, navigate])

  useEffect(() => {
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  useEffect(() => {
    if (selectedType === 'static' && form.isMicroservice) {
      setForm((prev) => ({ ...prev, isMicroservice: false }))
    }
  }, [form.isMicroservice, selectedType])

  useEffect(() => {
    setVisibleRepoCount(REPO_PAGE_SIZE)
  }, [repoQuery, repos])

  /* ---------------- derived ---------------- */

  const allowedTypes = plans[plan].types
  const isStatic = selectedType === 'static'
  const microserviceEnabled = !isStatic && form.isMicroservice
  const isPaid = plan !== 'free'
  const isGitHubUser = user && user.provider === 'github'
  const runtimeConfig = RUNTIME_VERSIONS[selectedType]

  const filteredRepos = useMemo(() => {
    const query = repoQuery.trim().toLowerCase()
    if (!query) return repos
    return repos.filter((r) =>
      `${r.full_name || ''} ${r.description || ''}`.toLowerCase().includes(query),
    )
  }, [repoQuery, repos])

  const visibleRepos = useMemo(
    () => filteredRepos.slice(0, visibleRepoCount),
    [filteredRepos, visibleRepoCount],
  )
  const hasMoreRepos = visibleRepoCount < filteredRepos.length

  const previewPayload = useMemo(
    () => buildPayload(form, plan, months, selectedType, selectedRepo),
    [form, months, plan, selectedType, selectedRepo],
  )

  /* ---------------- handlers ---------------- */

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setStepErrors((prev) => ({ ...prev, [key]: '' }))
  }, [])

  const selectPlan = (nextPlan) => {
    if (!plans[nextPlan].types.includes(selectedType)) {
      setStepErrors((prev) => ({
        ...prev,
        plan: `${plans[nextPlan].name} does not support ${TYPE_LABELS[selectedType]}.`,
      }))
      return
    }
    setPlan(nextPlan)
    setMonths(1)
    setStepErrors((prev) => ({ ...prev, plan: '' }))
  }

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo)
    setField('repoUrl', repo.html_url)
    setField('branch', repo.default_branch)
    if (!form.projectName) setField('projectName', repo.name)
    setRepoError('')
    setUseManualRepo(false)
    setStepErrors((prev) => ({ ...prev, repo: '' }))
  }

  const retryRepoFetch = async () => {
    setLoadingRepos(true)
    setRepoError('')
    try {
      const response = await api.get('/auth/user/repos')
      setRepos(response.data.repositories || [])
      setUseManualRepo(false)
    } catch (err) {
      console.error('Failed to fetch repos', err)
      setRepoError(
        'Could not load your GitHub repositories. You can still enter a repository URL manually.',
      )
      setUseManualRepo(true)
    } finally {
      setLoadingRepos(false)
    }
  }

  const handleRepoListScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget
    if (scrollHeight - scrollTop - clientHeight > 80 || !hasMoreRepos) return
    setVisibleRepoCount((c) => Math.min(c + REPO_PAGE_SIZE, filteredRepos.length))
  }

  const validateStep = (idx) => {
    const errors = {}
    switch (idx) {
      case 0:
        if (!allowedTypes.includes(selectedType))
          errors.plan = `Plan does not support ${TYPE_LABELS[selectedType]}.`
        if (isPaid && !MONTHS.includes(months)) errors.months = 'Pick a valid term.'
        break
      case 1:
        if (!form.projectName.trim()) errors.projectName = 'Project name is required.'
        if (!form.runtimeVersion) errors.runtimeVersion = 'Runtime version is required.'
        break
      case 2:
        if (!form.repoUrl.trim()) errors.repoUrl = 'Repository URL is required.'
        else {
          try {
            const repositoryUrl = new URL(form.repoUrl.trim())
            if (!['https:', 'http:'].includes(repositoryUrl.protocol))
              errors.repoUrl = 'Enter an HTTP or HTTPS Git repository URL.'
          } catch {
            errors.repoUrl = 'Enter a valid Git repository URL.'
          }
        }
        if (!form.branch.trim()) errors.branch = 'Branch is required.'
        break
      case 3:
        if (isStatic && !form.buildCommand.trim())
          errors.buildCommand = 'Build command is required.'
        if (isStatic && !form.publishDir.trim())
          errors.publishDir = 'Publish directory is required.'
        if (!isStatic && !form.startCommand.trim())
          errors.startCommand = 'Start command is required.'
        if (
          !isStatic &&
          (!Number.isInteger(Number(form.port)) ||
            Number(form.port) < 1 ||
            Number(form.port) > 65535)
        )
          errors.port = 'Port must be between 1 and 65535.'
        if (!microserviceEnabled && !form.subdomain.trim())
          errors.subdomain = 'Subdomain is required.'
        if (form.subdomain.trim() && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.subdomain.trim()))
          errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens.'
        break
      case 4:
        if (form.emailNotifications && !form.notificationEmail.trim())
          errors.notificationEmail = 'Email is required.'
        if (form.discordNotifications && !form.discordWebhookUrl.trim())
          errors.discordWebhookUrl = 'Discord webhook URL is required.'
        if (
          form.telegramNotifications &&
          (!form.telegramBotToken.trim() || !form.telegramChatId.trim())
        )
          errors.telegram = 'Telegram bot token and chat ID are required.'
        if (isPaid && !razorpayKey) errors.payment = 'Payment configuration missing.'
        break
      default:
        break
    }
    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) return
    setCompleted((c) => Array.from(new Set([...c, step])))
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    setSubmitting(true)
    setError('')
    setCreated(null)
    try {
      if (isPaid) {
        if (!razorpayLoaded) throw new Error('Payment gateway is still loading.')
        const { data: order } = await api.post('/project/payment/init', previewPayload)
        await new Promise((resolve, reject) => {
          const checkout = new window.Razorpay({
            key: razorpayKey,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'DeployHub',
            description: `${plans[plan].name} project deployment`,
            order_id: order.id || order.orderId,
            prefill: {
              name: user?.fullName || user?.fullname || '',
              email: user?.email || '',
            },
            handler: async (response) => {
              try {
                const { data } = await api.post('/project/payment/verify', {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                })
                setCreated(data)
                resolve(data)
              } catch (err) {
                reject(err)
              }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
          })
          checkout.open()
        })
      } else {
        const { data } = await api.post('/project/projects', {
          ...previewPayload,
          plan: 'free',
        })
        setCreated(data)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Project creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!TYPE_LABELS[normalizedType]) return <Navigate to="/projects/new" replace />

  /* ============================================================
   * Step renderers
   * ============================================================ */

  const renderStep0 = () => (
    <div className="space-y-6">
      <div
        role="radiogroup"
        aria-label="Select plan"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {Object.entries(plans).map(([key, item]) => {
          const selected = plan === key
          const supports = item.types.includes(selectedType)
          return (
            <button
              type="button"
              key={key}
              onClick={() => selectPlan(key)}
              role="radio"
              aria-checked={selected}
              disabled={!supports}
              className={cx(
                'relative rounded-2xl border p-5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
                selected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-200',
                !supports && 'cursor-not-allowed opacity-40',
              )}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-900">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">₹{item.price}</span>
                <span className="text-xs text-slate-600">/mo</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.types.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-900/[0.06] px-2 py-0.5 text-[11px] text-slate-700"
                  >
                    {TYPE_LABELS[t]}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                {item.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              {item.resources && (
                <div className="mt-4 rounded-lg bg-slate-900/[0.04] p-2 text-[11px] text-slate-700">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Resources</span>
                  <div className="grid grid-cols-3 gap-1">
                    <div>RAM {item.resources.ram}</div>
                    <div>CPU {item.resources.cpu}</div>
                    <div>Disk {item.resources.storage}</div>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {stepErrors.plan && <p className="text-sm text-red-600">{stepErrors.plan}</p>}

      {isPaid && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-600">
            Billing term
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MONTHS.map((m) => {
              const active = months === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={cx(
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-emerald-500 bg-emerald-500/10 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-200',
                  )}
                >
                  {m} {m === 1 ? 'month' : 'months'}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Total today:{' '}
            <span className="font-semibold text-slate-900">
              ₹{(Number(plans[plan].price) * months).toFixed(2)}
            </span>
          </p>
        </div>
      )}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs uppercase tracking-wider text-slate-600">Project type</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex h-8 items-center rounded-full bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700">
            {TYPE_LABELS[selectedType]}
          </span>
          <Link className="text-xs text-emerald-700" to="/projects/new">
            Change project type
          </Link>
        </div>
      </div>

      <Field label="Project name" required htmlFor="projectName" error={stepErrors.projectName}>
        <input
          id="projectName"
          type="text"
          value={form.projectName}
          onChange={(e) => setField('projectName', e.target.value)}
          placeholder="my-awesome-app"
          className={inputClass}
        />
      </Field>

      <Field
        label={`${runtimeConfig.label} version`}
        required
        htmlFor="runtimeVersion"
        error={stepErrors.runtimeVersion}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {runtimeConfig.versions.map((v) => {
            const active = form.runtimeVersion === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setField('runtimeVersion', v)}
                className={cx(
                  'rounded-lg border px-3 py-2.5 text-sm font-mono font-medium transition',
                  active
                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-200',
                )}
              >
                {v}
              </button>
            )
          })}
        </div>
      </Field>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      {/* Repo source */}
      {!isGitHubUser || useManualRepo ? (
        <Field label="Repository URL" required htmlFor="repoUrl" error={stepErrors.repoUrl}>
          <input
            id="repoUrl"
            type="url"
            value={form.repoUrl}
            onChange={(e) => {
              setSelectedRepo(null)
              setField('repoUrl', e.target.value)
            }}
            placeholder="https://github.com/user/repo"
            className={inputClass}
          />
          {isGitHubUser && (
            <button
              type="button"
              onClick={() => setUseManualRepo(false)}
              className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-700"
            >
              ← Back to repository list
            </button>
          )}
        </Field>
      ) : loadingRepos ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
            <span className="text-sm text-slate-700">Fetching your repositories…</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-900/5" />
            ))}
          </div>
        </div>
      ) : repoError && repos.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {repoError}
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={retryRepoFetch}
              className="text-emerald-700 hover:text-emerald-700"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setUseManualRepo(true)}
              className="text-emerald-700 hover:text-emerald-700"
            >
              Enter URL manually
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={repoQuery}
              onChange={(e) => setRepoQuery(e.target.value)}
              placeholder="Search repositories"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                setSelectedRepo(null)
                setUseManualRepo(true)
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-200 hover:text-slate-900"
            >
              Enter URL
            </button>
          </div>
          <div onScroll={handleRepoListScroll} className="mt-3 max-h-80 overflow-y-auto pr-1">
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleRepos.map((repo) => {
                const active = selectedRepo?.id === repo.id
                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => handleRepoSelect(repo)}
                    className={cx(
                      'rounded-lg border p-3 text-left transition',
                      active
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-200',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {repo.full_name}
                      </span>
                      {repo.private && (
                        <span className="shrink-0 rounded bg-slate-900/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-700">
                          Private
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{repo.description}</p>
                    )}
                  </button>
                )
              })}
            </div>
            {filteredRepos.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No repositories match your search.
              </p>
            )}
            {hasMoreRepos && (
              <p className="mt-3 text-center text-xs text-slate-500">Scroll for more…</p>
            )}
          </div>
        </div>
      )}

      {/* Branch + root dir */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branch" required htmlFor="branch" error={stepErrors.branch}>
          <input
            id="branch"
            type="text"
            value={form.branch}
            onChange={(e) => setField('branch', e.target.value)}
            placeholder="main"
            className={monoInputClass}
          />
        </Field>
        <Field label="Root directory" htmlFor="rootDirectory" hint="default: .">
          <input
            id="rootDirectory"
            type="text"
            value={form.rootDirectory}
            onChange={(e) => setField('rootDirectory', e.target.value)}
            placeholder="."
            className={monoInputClass}
          />
        </Field>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-5">
      {!isStatic && (
        <Toggle
          checked={form.isMicroservice}
          onChange={(v) =>
            setForm((p) => ({ ...p, isMicroservice: v, subdomain: v ? '' : p.subdomain }))
          }
          label="Microservice"
          description="Internal service — no public subdomain."
        />
      )}

      {isStatic ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Build command"
            required
            htmlFor="buildCommand"
            error={stepErrors.buildCommand}
          >
            <input
              id="buildCommand"
              type="text"
              value={form.buildCommand}
              onChange={(e) => setField('buildCommand', e.target.value)}
              className={monoInputClass}
            />
          </Field>
          <Field
            label="Publish directory"
            required
            htmlFor="publishDir"
            error={stepErrors.publishDir}
          >
            <input
              id="publishDir"
              type="text"
              value={form.publishDir}
              onChange={(e) => setField('publishDir', e.target.value)}
              className={monoInputClass}
            />
          </Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field
            label="Start command"
            required
            htmlFor="startCommand"
            error={stepErrors.startCommand}
          >
            <input
              id="startCommand"
              type="text"
              value={form.startCommand}
              onChange={(e) => setField('startCommand', e.target.value)}
              className={monoInputClass}
            />
          </Field>
          <Field label="Port" required htmlFor="port" error={stepErrors.port}>
            <input
              id="port"
              type="number"
              min={1}
              max={65535}
              value={form.port}
              onChange={(e) => setField('port', e.target.value)}
              className={monoInputClass}
            />
          </Field>
        </div>
      )}

      {!microserviceEnabled && (
        <Field
          label="Subdomain"
          required
          htmlFor="subdomain"
          hint="lowercase, hyphens"
          error={stepErrors.subdomain}
        >
          <div className="flex">
            <input
              id="subdomain"
              type="text"
              value={form.subdomain}
              onChange={(e) => setField('subdomain', e.target.value.toLowerCase())}
              placeholder="my-app"
              className={cx(monoInputClass, 'rounded-r-none')}
            />
            <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-white px-3 text-sm text-slate-600">
              .deployhub.online
            </span>
          </div>
        </Field>
      )}

      <Field label="Environment variables" htmlFor="envText" hint="KEY=value, one per line">
        <textarea
          id="envText"
          rows={5}
          value={form.envText}
          onChange={(e) => setField('envText', e.target.value)}
          placeholder={'DATABASE_URL=postgres://...\nNODE_ENV=production'}
          className={cx(monoInputClass, 'resize-y')}
        />
      </Field>

      {/* Uptime monitoring – only for Pro */}
      {plans[plan].uptime_monitoring && (
        <div className="space-y-3">
          <Toggle
            checked={form.monitorEnabled}
            onChange={(v) => setField('monitorEnabled', v)}
            label="Enable uptime monitoring"
            description="Periodic health checks with alerting."
          />
          {form.monitorEnabled && (
            <Field label="Health check path" htmlFor="healthPath">
              <input
                id="healthPath"
                type="text"
                value={form.healthPath}
                onChange={(e) => setField('healthPath', e.target.value)}
                className={monoInputClass}
              />
            </Field>
          )}
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>

        <Toggle
          checked={form.emailNotifications}
          onChange={(v) => setField('emailNotifications', v)}
          label="Email alerts"
          description="Build status + monitor alerts to your inbox."
        />
        {form.emailNotifications && (
          <Field
            label="Email address"
            required
            htmlFor="notificationEmail"
            error={stepErrors.notificationEmail}
          >
            <input
              id="notificationEmail"
              type="email"
              value={form.notificationEmail}
              onChange={(e) => setField('notificationEmail', e.target.value)}
              className={inputClass}
            />
          </Field>
        )}

        <Toggle
          checked={form.discordNotifications}
          onChange={(v) => setField('discordNotifications', v)}
          label="Discord webhook"
          description="POST events to a channel webhook."
        />
        {form.discordNotifications && (
          <Field
            label="Webhook URL"
            required
            htmlFor="discordWebhookUrl"
            error={stepErrors.discordWebhookUrl}
          >
            <input
              id="discordWebhookUrl"
              type="url"
              value={form.discordWebhookUrl}
              onChange={(e) => setField('discordWebhookUrl', e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className={inputClass}
            />
          </Field>
        )}

        <Toggle
          checked={form.telegramNotifications}
          onChange={(v) => setField('telegramNotifications', v)}
          label="Telegram bot"
          description="Send messages via a Telegram bot."
        />
        {form.telegramNotifications && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bot token" required htmlFor="telegramBotToken">
              <input
                id="telegramBotToken"
                type="text"
                value={form.telegramBotToken}
                onChange={(e) => setField('telegramBotToken', e.target.value)}
                className={monoInputClass}
              />
            </Field>
            <Field label="Chat ID" required htmlFor="telegramChatId">
              <input
                id="telegramChatId"
                type="text"
                value={form.telegramChatId}
                onChange={(e) => setField('telegramChatId', e.target.value)}
                className={monoInputClass}
              />
            </Field>
            {stepErrors.telegram && (
              <p className="sm:col-span-2 text-xs text-red-600">{stepErrors.telegram}</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Review</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row k="Plan" v={`${plans[plan].name}${isPaid ? ` · ${months}mo` : ''}`} />
          <Row k="Type" v={TYPE_LABELS[selectedType]} />
          <Row k="Name" v={form.projectName || '—'} />
          <Row k="Runtime" v={`${runtimeConfig.label} ${form.runtimeVersion}`} />
          <Row k="Repo" v={form.repoUrl || '—'} mono truncate />
          <Row k="Branch" v={form.branch} mono />
          <Row k="Root" v={form.rootDirectory} mono />
          {isStatic ? (
            <>
              <Row k="Build" v={form.buildCommand} mono />
              <Row k="Publish" v={form.publishDir} mono />
            </>
          ) : (
            <>
              <Row k="Start" v={form.startCommand} mono />
              <Row k="Port" v={form.port} mono />
            </>
          )}
          {!microserviceEnabled && (
            <Row
              k="Subdomain"
              v={form.subdomain ? `${form.subdomain}.deployhub.online` : '—'}
              mono
            />
          )}
          {microserviceEnabled && <Row k="Mode" v="Microservice" />}
          {plans[plan].uptime_monitoring && (
            <Row k="Monitor" v={form.monitorEnabled ? `On · ${form.healthPath}` : 'Off'} />
          )}
          <Row
            k="Alerts"
            v={
              [
                form.emailNotifications && 'Email',
                form.discordNotifications && 'Discord',
                form.telegramNotifications && 'Telegram',
              ]
                .filter(Boolean)
                .join(', ') || 'None'
            }
          />
        </dl>
        {previewPayload.env && (
          <div className="mt-3">
            <div className="text-xs uppercase tracking-wider text-slate-600">Env vars</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.keys(previewPayload.env).map((k) => (
                <span
                  key={k}
                  className="rounded bg-slate-900/[0.06] px-2 py-0.5 font-mono text-[11px] text-slate-700"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {stepErrors.payment && <p className="text-sm text-red-600">{stepErrors.payment}</p>}
    </div>
  )

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4]

  /* ============================================================
   * Shell
   * ============================================================ */

  return (
    <div className="new-project-flow text-slate-900">
      <div className="mx-auto max-w-6xl pb-32 lg:pb-12">
        <div ref={topRef} />

        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-slate-500">DeployHub</div>
            <h1 className="mt-0.5 truncate text-xl font-semibold text-slate-900 sm:text-2xl">
              Your next {TYPE_LABELS[selectedType]} project
            </h1>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-200 hover:text-slate-900"
          >
            Cancel
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar / progress */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <StepIndicator
              step={step}
              setStep={setStep}
              validateStep={validateStep}
              completed={completed}
            />
          </aside>

          {/* Active step */}
          <main className="min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-5 border-b border-slate-200 pb-4">
                <h2 className="text-lg font-semibold text-slate-900">{STEPS[step].title}</h2>
                <p className="mt-0.5 text-sm text-slate-600">{STEPS[step].desc}</p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {stepRenderers[step]()}
            </div>

            {/* Desktop action bar */}
            <div className="mt-4 hidden items-center justify-between gap-3 lg:flex">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0 || submitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-200 hover:text-slate-900 disabled:opacity-40"
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-white" />
                  )}
                  {isPaid ? 'Pay & Deploy' : 'Create Project'}
                </button>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 new-project-mobile-actions px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || submitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-white" />
              )}
              {isPaid ? 'Pay & Deploy' : 'Create'}
            </button>
          )}
        </div>
      </div>

      {/* ====== REDIRECT OVERLAY ====== */}
      {redirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-md w-full shadow-2xl">
            <div className="mb-4 flex justify-center">
              <div className="relative h-16 w-16">
                <svg
                  className="h-16 w-16 animate-spin text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900">
                  {countdown}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Redirecting to logs</h3>
            <p className="mt-1 text-sm text-slate-600">
              Your project is ready! You’ll be redirected in {countdown}s.
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * Review row
 * ============================================================ */

function Row({ k, v, mono, truncate }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-slate-200 py-1.5 last:border-0">
      <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-slate-500">{k}</dt>
      <dd
        className={cx(
          'min-w-0 flex-1 text-sm text-slate-700',
          mono && 'font-mono text-[13px]',
          truncate && 'truncate',
        )}
        title={typeof v === 'string' ? v : undefined}
      >
        {v}
      </dd>
    </div>
  )
}
