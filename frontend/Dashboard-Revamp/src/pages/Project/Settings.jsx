import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/apiclient'
import PageHeader from '../../components/PageHeader'
import Skeleton from '../../components/ui/Skeleton'
import { LoadState } from '../../components/ui'

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`theme-switch-track w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${value ? 'bg-emerald-500' : 'bg-neutral-700'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${value ? 'left-[calc(100%-20px)]' : 'left-1'}`}
      />
    </button>
  )
}

function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
      <h2 className="text-sm font-medium text-slate-900">{title}</h2>
      {right}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  )
}

function TextInput({ ...props }) {
  return (
    <input
      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-neutral-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all font-mono"
      {...props}
    />
  )
}

function SaveBtn({ saving, saved, onClick, label = 'Save', dirty = true }) {
  const disabled = saving || !dirty
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
        disabled ? 'opacity-40 blur-[0.4px] saturate-50' : 'opacity-100 blur-0'
      } ${
        saved
          ? 'bg-green-500/10 text-green-700 border border-green-500/30'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
      }`}
    >
      {saving ? 'Saving…' : saved ? 'Saved' : label}
    </button>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-5 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Settings() {
  const { id: projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projectPlan, setProjectPlan] = useState('free')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('node')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('master')
  const [rootDirectory, setRootDirectory] = useState('.')
  const [startCommand, setStartCommand] = useState('')
  const [port, setPort] = useState('3000')
  const [publishDir, setPublishDir] = useState('')
  const [buildCommand, setBuildCommand] = useState('')
  const [savingBuild, setSavingBuild] = useState(false)
  const [savedBuild, setSavedBuild] = useState(false)
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }])
  const [savingEnv, setSavingEnv] = useState(false)
  const [savedEnv, setSavedEnv] = useState(false)
  const [monitorEnabled, setMonitorEnabled] = useState(false)
  const [intervalSeconds, setIntervalSeconds] = useState(60)
  const [healthPath, setHealthPath] = useState('/health')
  const [failedTries, setFailedTries] = useState(2)
  const [discordEnabled, setDiscordEnabled] = useState(false)
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [savingNotif, setSavingNotif] = useState(false)
  const [savedNotif, setSavedNotif] = useState(false)
  const [notifError, setNotifError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Snapshots used to detect unsaved changes per-section
  const [initialBuild, setInitialBuild] = useState(null)
  const [initialEnv, setInitialEnv] = useState(null)
  const [initialNotif, setInitialNotif] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/project/settings/${projectId}`)
        const s = response.data.settings
        setProjectName(s.projectName || '')
        setProjectType(s.projectType || 'node')
        setRepoUrl(s.repoUrl || '')
        setBranch(s.branch || 'master')
        setProjectPlan(s.projectPlan || 'free')
        setRootDirectory(s.rootDirectory || '.')
        if (s.startCommand) setStartCommand(s.startCommand)
        if (s.port) setPort(String(s.port))
        if (s.publishDir) setPublishDir(s.publishDir)
        if (s.buildCommand) setBuildCommand(s.buildCommand)

        let monitor = { enabled: false, intervalSeconds: 60, healthPath: '/health', failedTries: 2 }
        if (s.monitor) {
          monitor = {
            enabled: s.monitor.enabled || false,
            intervalSeconds: s.monitor.intervalSeconds || 60,
            healthPath: s.monitor.healthPath || '/health',
            failedTries: s.monitor.failedTries || 2,
          }
          setMonitorEnabled(monitor.enabled)
          setIntervalSeconds(monitor.intervalSeconds)
          setHealthPath(monitor.healthPath)
          setFailedTries(monitor.failedTries)
        }

        let notif = {
          discordEnabled: false,
          discordWebhook: '',
          telegramEnabled: false,
          telegramBotToken: '',
          telegramChatId: '',
          emailEnabled: false,
          emailAddress: '',
        }
        if (s.notifications) {
          const n = s.notifications
          if (n.discord) {
            notif.discordEnabled = n.discord.enabled || false
            notif.discordWebhook = n.discord.webhookUrl || ''
            setDiscordEnabled(notif.discordEnabled)
            setDiscordWebhook(notif.discordWebhook)
          }
          if (n.telegram) {
            notif.telegramEnabled = n.telegram.enabled || false
            notif.telegramBotToken = n.telegram.botToken || ''
            notif.telegramChatId = n.telegram.chatId || ''
            setTelegramEnabled(notif.telegramEnabled)
            setTelegramBotToken(notif.telegramBotToken)
            setTelegramChatId(notif.telegramChatId)
          }
          if (n.email) {
            notif.emailEnabled = n.email.enabled || false
            notif.emailAddress = n.email.emailAddress || ''
            setEmailEnabled(notif.emailEnabled)
            setEmailAddress(notif.emailAddress)
          }
        }

        let env = [{ key: '', value: '' }]
        if (s.env && typeof s.env === 'object' && Object.keys(s.env).length > 0) {
          env = Object.entries(s.env).map(([key, value]) => ({ key, value }))
          setEnvVars(env)
        }

        setInitialBuild({
          buildCommand: s.buildCommand || '',
          publishDir: s.publishDir || '',
          startCommand: s.startCommand || '',
          port: s.port ? String(s.port) : '3000',
          rootDirectory: s.rootDirectory || '.',
        })
        setInitialEnv(env)
        setInitialNotif({ monitor, ...notif })
      } catch {
        setError('Failed to load project settings.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [projectId])

  const buildDirty = useMemo(() => {
    if (!initialBuild) return false
    return (
      JSON.stringify(initialBuild) !==
      JSON.stringify({ buildCommand, publishDir, startCommand, port, rootDirectory })
    )
  }, [initialBuild, buildCommand, publishDir, startCommand, port, rootDirectory])

  const envDirty = useMemo(() => {
    if (!initialEnv) return false
    return JSON.stringify(initialEnv) !== JSON.stringify(envVars)
  }, [initialEnv, envVars])

  const notifDirty = useMemo(() => {
    if (!initialNotif) return false
    const current = {
      monitor: { enabled: monitorEnabled, intervalSeconds, healthPath, failedTries },
      discordEnabled,
      discordWebhook,
      telegramEnabled,
      telegramBotToken,
      telegramChatId,
      emailEnabled,
      emailAddress,
    }
    return JSON.stringify(initialNotif) !== JSON.stringify(current)
  }, [
    initialNotif,
    monitorEnabled,
    intervalSeconds,
    healthPath,
    failedTries,
    discordEnabled,
    discordWebhook,
    telegramEnabled,
    telegramBotToken,
    telegramChatId,
    emailEnabled,
    emailAddress,
  ])

  const handleSaveBuild = async () => {
    setSavingBuild(true)
    setSavedBuild(false)
    try {
      await api.patch(`/project/settings/build-and-start/${projectId}`, {
        buildCommand,
        publishDir,
        startCommand,
        port: parseInt(port) || 3000,
        rootDirectory,
      })
      setInitialBuild({ buildCommand, publishDir, startCommand, port, rootDirectory })
      setSavedBuild(true)
      setTimeout(() => setSavedBuild(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save build settings.')
    } finally {
      setSavingBuild(false)
    }
  }

  const handleSaveEnv = async () => {
    setSavingEnv(true)
    setSavedEnv(false)
    const env = envVars.reduce((acc, { key, value }) => {
      if (key.trim() && value.trim()) acc[key.trim()] = value.trim()
      return acc
    }, {})
    try {
      await api.patch(`/project/settings/env/${projectId}`, { env })
      setInitialEnv(envVars)
      setSavedEnv(true)
      setTimeout(() => setSavedEnv(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save environment variables.')
    } finally {
      setSavingEnv(false)
    }
  }

  const handleSaveNotif = async () => {
    setNotifError(null)
    setSavingNotif(true)
    setSavedNotif(false)
    if (monitorEnabled && projectPlan !== 'pro') {
      setNotifError('Health monitoring requires a Pro plan.')
      setSavingNotif(false)
      return
    }
    try {
      await api.patch(`/project/settings/notification/${projectId}`, {
        projectPlan,
        monitor: { enabled: monitorEnabled, intervalSeconds, healthPath, failedTries },
        notifications: {
          discord: {
            enabled: discordEnabled,
            webhookUrl: discordEnabled ? discordWebhook : undefined,
          },
          telegram: {
            enabled: telegramEnabled,
            botToken: telegramEnabled ? telegramBotToken : undefined,
            chatId: telegramEnabled ? telegramChatId : undefined,
          },
          email: { enabled: emailEnabled, emailAddress: emailEnabled ? emailAddress : undefined },
        },
      })
      setInitialNotif({
        monitor: { enabled: monitorEnabled, intervalSeconds, healthPath, failedTries },
        discordEnabled,
        discordWebhook,
        telegramEnabled,
        telegramBotToken,
        telegramChatId,
        emailEnabled,
        emailAddress,
      })
      setSavedNotif(true)
      setTimeout(() => setSavedNotif(false), 3000)
    } catch (err) {
      setNotifError(err?.response?.data?.message || 'Failed to save notification settings.')
    } finally {
      setSavingNotif(false)
    }
  }

  const handleEnvChange = (i, field, val) => {
    const updated = [...envVars]
    updated[i][field] = val
    setEnvVars(updated)
  }
  const addEnvRow = () => setEnvVars([...envVars, { key: '', value: '' }])
  const removeEnvRow = (i) =>
    envVars.length > 1 && setEnvVars(envVars.filter((_, idx) => idx !== i))

  const handleDelete = async () => {
    if (confirmName !== projectName) return
    setDeleting(true)
    try {
      await api.delete(`/project/project/${projectId}`)
      window.location.href = '/'
    } catch {
      setError('Failed to delete project.')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (!loading && !initialBuild) return <LoadState error={error || 'Settings are unavailable.'} retry={() => window.location.reload()} />

  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader section="Project" title="Settings" />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 ml-3">
                ✕
              </button>
            </div>
          )}

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <SectionHeader title="General" />
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Project Name</FieldLabel>
                <TextInput value={projectName} readOnly aria-label="Project name" />
              </div>
              <div>
                <FieldLabel>Project Type</FieldLabel>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm text-slate-600 capitalize">{projectType}</span>
                </div>
              </div>
              <div className="col-span-2">
                <FieldLabel>Repository</FieldLabel>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm text-slate-700 flex-1 truncate">
                    {repoUrl}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-900/[0.04] border border-slate-200 rounded text-xs font-medium text-emerald-700">
                    {branch}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <SectionHeader
              title={projectType === 'static' ? 'Build & Output' : 'Start Command & Port'}
              right={
                <SaveBtn
                  saving={savingBuild}
                  saved={savedBuild}
                  onClick={handleSaveBuild}
                  dirty={buildDirty}
                />
              }
            />
            <div className="p-5">
              {projectType === 'static' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Root Directory</FieldLabel>
                    <TextInput
                      value={rootDirectory}
                      onChange={(e) => setRootDirectory(e.target.value)}
                      placeholder="."
                    />
                  </div>
                  <div>
                    <FieldLabel>Build Command</FieldLabel>
                    <TextInput
                      value={buildCommand}
                      onChange={(e) => setBuildCommand(e.target.value)}
                      placeholder="npm run build"
                    />
                  </div>
                  <div>
                    <FieldLabel>Publish Directory</FieldLabel>
                    <TextInput
                      value={publishDir}
                      onChange={(e) => setPublishDir(e.target.value)}
                      placeholder="dist"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Root Directory</FieldLabel>
                    <TextInput
                      value={rootDirectory}
                      onChange={(e) => setRootDirectory(e.target.value)}
                      placeholder="."
                    />
                  </div>
                  <div>
                    <FieldLabel>Start Command</FieldLabel>
                    <TextInput
                      value={startCommand}
                      onChange={(e) => setStartCommand(e.target.value)}
                      placeholder="node index.js"
                    />
                  </div>
                  <div>
                    <FieldLabel>Port</FieldLabel>
                    <TextInput
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <SectionHeader
              title="Environment Variables"
              right={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addEnvRow}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-900/5 transition-colors"
                  >
                    Add
                  </button>
                  <SaveBtn
                    saving={savingEnv}
                    saved={savedEnv}
                    onClick={handleSaveEnv}
                    dirty={envDirty}
                  />
                </div>
              }
            />
            <div className="p-5 space-y-2">
              {envVars.map((env, idx) => (
                <div key={idx} className="flex gap-2 items-center group">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={env.key}
                    onChange={(e) => handleEnvChange(idx, 'key', e.target.value)}
                    className="w-44 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm text-emerald-700 placeholder-neutral-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none"
                  />
                  <span className="text-slate-400 font-mono">=</span>
                  <input
                    type="text"
                    placeholder="value"
                    value={env.value}
                    onChange={(e) => handleEnvChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 placeholder-neutral-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeEnvRow(idx)}
                    disabled={envVars.length === 1}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition disabled:opacity-20 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 font-mono pt-1">
                Changes apply to future deployments. Redeploy after updating variables.
              </p>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <SectionHeader
              title="Monitoring & Alerts"
              right={
                <SaveBtn
                  saving={savingNotif}
                  saved={savedNotif}
                  onClick={handleSaveNotif}
                  dirty={notifDirty}
                />
              }
            />
            {notifError && (
              <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/20 text-red-600 px-3 py-2 rounded-lg text-xs">
                {notifError}
              </div>
            )}
            <div className="p-5 space-y-5">
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">Health Monitoring</span>
                    {projectPlan !== 'pro' && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        Pro
                      </span>
                    )}
                  </div>
                  <Toggle
                    label="Health monitoring"
                    value={monitorEnabled}
                    onChange={(v) => {
                      if (v && projectPlan !== 'pro') {
                        setNotifError('Upgrade to Pro to enable health monitoring.')
                        return
                      }
                      setNotifError(null)
                      setMonitorEnabled(v)
                    }}
                  />
                </div>
                {monitorEnabled && (
                  <div className="px-4 py-4 grid grid-cols-3 gap-4 border-t border-slate-200">
                    <div>
                      <FieldLabel>Interval (sec)</FieldLabel>
                      <TextInput
                        type="number"
                        value={intervalSeconds}
                        onChange={(e) => setIntervalSeconds(parseInt(e.target.value) || 60)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Health Path</FieldLabel>
                      <TextInput
                        value={healthPath}
                        onChange={(e) => setHealthPath(e.target.value)}
                        placeholder="/health"
                      />
                    </div>
                    <div>
                      <FieldLabel>Failed Tries</FieldLabel>
                      <TextInput
                        type="number"
                        value={failedTries}
                        onChange={(e) => setFailedTries(parseInt(e.target.value) || 2)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden divide-y theme-divider">
                {[
                  {
                    key: 'discord',
                    label: 'Discord',
                    enabled: discordEnabled,
                    setEnabled: setDiscordEnabled,
                    fields: discordEnabled && (
                      <div className="px-4 pb-3">
                        <FieldLabel>Webhook URL</FieldLabel>
                        <TextInput
                          type="url"
                          value={discordWebhook}
                          onChange={(e) => setDiscordWebhook(e.target.value)}
                          placeholder="https://discord.com/api/webhooks/…"
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'telegram',
                    label: 'Telegram',
                    enabled: telegramEnabled,
                    setEnabled: setTelegramEnabled,
                    fields: telegramEnabled && (
                      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Bot Token</FieldLabel>
                          <TextInput
                            value={telegramBotToken}
                            onChange={(e) => setTelegramBotToken(e.target.value)}
                          />
                        </div>
                        <div>
                          <FieldLabel>Chat ID</FieldLabel>
                          <TextInput
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'email',
                    label: 'Email',
                    enabled: emailEnabled,
                    setEnabled: setEmailEnabled,
                    fields: emailEnabled && (
                      <div className="px-4 pb-3">
                        <FieldLabel>Email Address</FieldLabel>
                        <TextInput
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                    ),
                  },
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-700">{item.label}</span>
                      <Toggle
                        label={`${item.label} notifications`}
                        value={item.enabled}
                        onChange={item.setEnabled}
                      />
                    </div>
                    {item.fields}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
            <SectionHeader title="Danger Zone" />
            <div className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Delete Project</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently deletes this project and all its data.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-red-500/30 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-500/10 transition whitespace-nowrap"
              >
                Delete Project
              </button>
            </div>
          </section>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Project</h2>
            <p className="text-xs text-slate-500 mb-4">
              Type <span className="font-mono text-emerald-700">{projectName}</span> to confirm.
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={projectName}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 mb-4 focus:border-red-500/50 outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmName('')
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-900/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmName !== projectName || deleting}
                className="px-4 py-2 border border-red-500/30 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-500/10 disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
