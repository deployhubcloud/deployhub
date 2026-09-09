import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/apiclient'
import PageHeader from '../../components/PageHeader'
import Skeleton from '../../components/ui/Skeleton'

function DomainSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function sslStatusTone(status) {
  if (status === 'active') return 'text-green-700'
  if (status === 'failed') return 'text-red-600'
  return 'text-emerald-700'
}

export function Domain() {
  const { id: projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [domainSettings, setDomainSettings] = useState(null)
  const [originalSubdomain, setOriginalSubdomain] = useState('')
  const [newSubdomain, setNewSubdomain] = useState('')
  const [customDomains, setCustomDomains] = useState([])
  const [certificates, setCertificates] = useState([])
  const [dns, setDns] = useState({ aRecord: null, cnameTarget: 'cname.deployhub.online' })
  const [newCustomDomain, setNewCustomDomain] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [customDomainSaving, setCustomDomainSaving] = useState(false)
  const [customDomainRemoving, setCustomDomainRemoving] = useState(null)
  const [customDomainRenewing, setCustomDomainRenewing] = useState(null)
  const [customDomainError, setCustomDomainError] = useState(null)
  const [cooldown, setCooldown] = useState(false)

  const loadDomain = useCallback(async () => {
    const response = await api.get(`/project/settings/domain/${projectId}`)
    const ds = response.data.domainSettings
    setDomainSettings(ds)
    setOriginalSubdomain(ds.subdomain || '')
    setNewSubdomain(ds.subdomain || '')
    setCustomDomains(ds.customDomains || [])
    setCertificates(ds.certificates || [])
    setDns(ds.dns || { aRecord: null, cnameTarget: 'cname.deployhub.online' })
  }, [projectId])

  useEffect(() => {
    const fetchDomain = async () => {
      try {
        setLoading(true)
        await loadDomain()
      } catch {
        setError('Failed to load domain settings.')
      } finally {
        setLoading(false)
      }
    }
    fetchDomain()
  }, [loadDomain])

  const certByDomain = useMemo(() => {
    const map = {}
    for (const c of certificates) map[c.domain] = c
    return map
  }, [certificates])

  const handleSubdomainSave = async () => {
    if (!newSubdomain.trim() || newSubdomain === originalSubdomain) return
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(newSubdomain.trim())) {
      setError('Use lowercase letters, numbers, and hyphens for your subdomain.')
      return
    }
    setError(null)
    setSuccessMessage('')
    setSaving(true)
    try {
      await api.put(`/project/subdomain/${projectId}`, {
        oldSubdomain: originalSubdomain,
        newSubdomain: newSubdomain.trim(),
      })
      setOriginalSubdomain(newSubdomain.trim())
      setSuccessMessage('Subdomain updated successfully!')
      setCooldown(true)
      setTimeout(() => setCooldown(false), 8000)
    } catch (err) {
      setError(`${err.response?.data?.message}`)
    } finally {
      setSaving(false)
    }
  }

  const addCustomDomain = async () => {
    const domain = newCustomDomain.trim().toLowerCase()
    if (!domain || customDomains.includes(domain)) return
    if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
      setCustomDomainError('Enter a valid hostname, such as app.example.com.')
      return
    }
    setCustomDomainError(null)
    setCustomDomainSaving(true)
    try {
      await api.post(`/project/custom-domain/${projectId}`, { domain })
      setNewCustomDomain('')
      setShowAddForm(false)
      setSuccessMessage(`Domain ${domain} added successfully.`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadDomain()
    } catch (err) {
      setCustomDomainError(err.response?.data?.message || 'Failed to add custom domain.')
    } finally {
      setCustomDomainSaving(false)
    }
  }

  const removeCustomDomain = async (domain) => {
    setCustomDomainError(null)
    setCustomDomainRemoving(domain)
    try {
      await api.delete(`/project/custom-domain/${projectId}`, { data: { domain } })
      setSuccessMessage(`Domain ${domain} removed successfully.`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadDomain()
    } catch (err) {
      setCustomDomainError(err.response?.data?.message || 'Failed to remove custom domain.')
    } finally {
      setCustomDomainRemoving(null)
    }
  }

  const renewCustomDomain = async (domain) => {
    setCustomDomainError(null)
    setCustomDomainRenewing(domain)
    try {
      await api.post(`/project/custom-domain/${projectId}/renew`, { domain })
      setSuccessMessage(`SSL certificate renewed for ${domain}.`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadDomain()
    } catch (err) {
      setCustomDomainError(err.response?.data?.message || 'Failed to renew certificate.')
    } finally {
      setCustomDomainRenewing(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader section="Project" title="Domains" />
        <DomainSkeleton />
      </div>
    )
  }

  if (!domainSettings) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader section="Project" title="Domains" />
        <p className="text-slate-500 text-sm">Could not load domain settings.</p>
      </div>
    )
  }

  const isMicro = domainSettings.isMicroservice
  const isFree = domainSettings.plan === 'free'
  const canEditSubdomain = !isMicro
  const canManageCustom = !isFree && !isMicro

  const DNS_RECORDS = [
    ...(dns.aRecord ? [{ type: 'A', name: '@ / host', value: dns.aRecord }] : []),
    { type: 'CNAME', name: 'www / subdomain', value: dns.cnameTarget || 'cname.deployhub.online' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader section="Project" title="Domains" />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 px-4 py-3 rounded-xl text-sm">
          {successMessage}
        </div>
      )}
      {customDomainError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
          {customDomainError}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-medium text-slate-900">DeployHub Subdomain</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                aria-label="Project subdomain"
                value={newSubdomain}
                onChange={(e) => setNewSubdomain(e.target.value)}
                disabled={!canEditSubdomain || cooldown}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none disabled:opacity-50"
              />
              <span className="text-slate-500 text-sm">.deployhub.online</span>
            </div>
          </div>
          {isMicro && (
            <p className="text-xs text-slate-500">Subdomain cannot be changed for microservices.</p>
          )}
          {cooldown && (
            <p className="text-xs text-emerald-700">
              Changes are being processed. This may take up to 2 minutes.
            </p>
          )}
          {!isMicro && newSubdomain !== originalSubdomain && !cooldown && (
            <button
              onClick={handleSubdomainSave}
              disabled={saving || !newSubdomain.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Subdomain'}
            </button>
          )}
        </div>
      </section>

      {isMicro && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-medium text-slate-900">Internal URL</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-mono text-sm text-slate-700 flex-1 truncate">
                {domainSettings.internalUrl || 'Not configured'}
              </span>
              {domainSettings.internalUrl && (
                <button
                  onClick={() => navigator.clipboard.writeText(domainSettings.internalUrl)}
                  className="text-xs text-slate-500 hover:text-emerald-700 transition-colors"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-900">Custom Domains</h2>
          {isFree && !isMicro && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Pro
            </span>
          )}
        </div>
        <div className="p-5 space-y-3">
          {customDomains.length === 0 && !showAddForm && (
            <p className="text-sm text-slate-500">No custom domains configured.</p>
          )}
          {customDomains.map((domain) => {
            const cert = certByDomain[domain]
            return (
              <div key={domain} className="py-3 border-b border-slate-200 last:border-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${cert?.status === 'failed' ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                    <span className="font-mono text-sm text-slate-900 truncate">{domain}</span>
                    <span className={`text-xs ${sslStatusTone(cert?.status || 'active')}`}>
                      {cert?.status || 'active'}
                    </span>
                  </div>
                  {canManageCustom && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => renewCustomDomain(domain)}
                        disabled={customDomainRenewing === domain}
                        className="text-xs text-slate-500 hover:text-emerald-700 transition disabled:opacity-50"
                      >
                        {customDomainRenewing === domain ? 'Renewing…' : 'Renew SSL'}
                      </button>
                      <button
                        onClick={() => removeCustomDomain(domain)}
                        disabled={customDomainRemoving === domain}
                        className="text-xs text-slate-500 hover:text-red-600 transition disabled:opacity-50"
                      >
                        {customDomainRemoving === domain ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  )}
                </div>
                {cert && (
                  <div className="text-[11px] text-slate-500 font-mono pl-5">
                    Expires {formatDate(cert.expiresAt)} · Next renew {formatDate(cert.nextRenewAt)}
                    {cert.lastError ? ` · Last error: ${cert.lastError}` : ''}
                  </div>
                )}
              </div>
            )
          })}

          {canManageCustom && (
            <>
              {showAddForm ? (
                <div className="pt-3 space-y-3 border-t border-slate-200">
                  <input
                    type="text"
                    aria-label="Custom domain"
                    value={newCustomDomain}
                    onChange={(e) => setNewCustomDomain(e.target.value)}
                    placeholder="api.example.com"
                    disabled={customDomainSaving}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-500/50 outline-none disabled:opacity-50"
                  />
                  <p className="text-[11px] text-slate-500">
                    Point DNS first: A → {dns.aRecord || 'your server IP'} or CNAME →{' '}
                    {dns.cnameTarget || 'cname.deployhub.online'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={addCustomDomain}
                      disabled={!newCustomDomain.trim() || customDomainSaving}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {customDomainSaving ? 'Adding…' : 'Add Domain'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setNewCustomDomain('')
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-900/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-700 transition-colors"
                >
                  + Add domain
                </button>
              )}
            </>
          )}

          {isFree && !isMicro && (
            <p className="text-xs text-slate-500 pt-2">
              Custom domains are available on paid plans.
            </p>
          )}
        </div>
      </section>

      {canManageCustom && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-medium text-slate-900">DNS Records</h2>
            <p className="text-xs text-slate-500 mt-1">
              Use either A record or CNAME before adding the domain. SSL is issued automatically.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-5 font-medium">Type</th>
                  <th className="py-3 px-5 font-medium">Name</th>
                  <th className="py-3 px-5 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {DNS_RECORDS.map((rec, i) => (
                  <tr key={i} className="border-b border-slate-200 last:border-0">
                    <td className="py-3 px-5 text-slate-700">{rec.type}</td>
                    <td className="py-3 px-5 text-slate-600">{rec.name}</td>
                    <td className="py-3 px-5 text-slate-700">{rec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
