import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/apiclient";
import PageHeader from "../../components/PageHeader";
import Skeleton from "../../components/ui/Skeleton";

function DomainSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2].map(i => (
        <div key={i} className="bg-[#111114] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function Domain() {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [domainSettings, setDomainSettings] = useState(null);
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [newSubdomain, setNewSubdomain] = useState("");
  const [customDomains, setCustomDomains] = useState([]);
  const [newCustomDomain, setNewCustomDomain] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [customDomainSaving, setCustomDomainSaving] = useState(false);
  const [customDomainRemoving, setCustomDomainRemoving] = useState(null);
  const [customDomainError, setCustomDomainError] = useState(null);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    const fetchDomain = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/project/settings/domain/${projectId}`);
        const ds = response.data.domainSettings;
        setDomainSettings(ds);
        setOriginalSubdomain(ds.subdomain || "");
        setNewSubdomain(ds.subdomain || "");
        setCustomDomains(ds.customDomains || []);
      } catch {
        setError("Failed to load domain settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchDomain();
  }, [projectId]);

  const handleSubdomainSave = async () => {
    if (!newSubdomain.trim() || newSubdomain === originalSubdomain) return;
    setError(null);
    setSuccessMessage("");
    setSaving(true);
    try {
      await api.put(`/project/subdomain/${projectId}`, {
        oldSubdomain: originalSubdomain,
        newSubdomain: newSubdomain.trim(),
      });
      setOriginalSubdomain(newSubdomain.trim());
      setSuccessMessage("Subdomain updated successfully!");
      setCooldown(true);
      setTimeout(() => setCooldown(false), 8000);
    } catch (err) {
      setError(`${err.response?.data?.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addCustomDomain = async () => {
    const domain = newCustomDomain.trim().toLowerCase();
    if (!domain || customDomains.includes(domain)) return;
    setCustomDomainError(null);
    setCustomDomainSaving(true);
    try {
      await api.post(`/project/custom-domain/${projectId}`, { domain });
      setCustomDomains(prev => [...prev, domain]);
      setNewCustomDomain("");
      setShowAddForm(false);
      setSuccessMessage(`Domain ${domain} added successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setCustomDomainError(err.response?.data?.message || "Failed to add custom domain.");
    } finally {
      setCustomDomainSaving(false);
    }
  };

  const removeCustomDomain = async (domain) => {
    setCustomDomainError(null);
    setCustomDomainRemoving(domain);
    try {
      await api.delete(`/project/custom-domain/${projectId}`, { data: { domain } });
      setCustomDomains(prev => prev.filter(d => d !== domain));
      setSuccessMessage(`Domain ${domain} removed successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setCustomDomainError(err.response?.data?.message || "Failed to remove custom domain.");
    } finally {
      setCustomDomainRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader section="Project" title="Domains" />
        <DomainSkeleton />
      </div>
    );
  }

  if (!domainSettings) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader section="Project" title="Domains" />
        <p className="text-neutral-500 text-sm">Could not load domain settings.</p>
      </div>
    );
  }

  const isMicro = domainSettings.isMicroservice;
  const isFree = domainSettings.plan === "free";
  const canEditSubdomain = !isMicro;
  const canManageCustom = !isFree && !isMicro;

  const DNS_RECORDS = [
    { type: 'CNAME', name: '@', value: 'cname.deployhub.online', status: 'pending' },
    { type: 'CNAME', name: 'www', value: 'cname.deployhub.online', status: 'pending' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader section="Project" title="Domains" />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">{successMessage}</div>
      )}
      {customDomainError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{customDomainError}</div>
      )}

      <section className="bg-[#111114] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-white">DeployHub Subdomain</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={newSubdomain}
                onChange={(e) => setNewSubdomain(e.target.value)}
                disabled={!canEditSubdomain || cooldown}
                className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none disabled:opacity-50"
              />
              <span className="text-neutral-500 text-sm">.deployhub.online</span>
            </div>
          </div>
          {isMicro && (
            <p className="text-xs text-neutral-500">Subdomain cannot be changed for microservices.</p>
          )}
          {cooldown && (
            <p className="text-xs text-amber-400">Changes are being processed. This may take up to 2 minutes.</p>
          )}
          {!isMicro && newSubdomain !== originalSubdomain && !cooldown && (
            <button onClick={handleSubdomainSave} disabled={saving || !newSubdomain.trim()}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save Subdomain"}
            </button>
          )}
        </div>
      </section>

      {isMicro && (
        <section className="bg-[#111114] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-medium text-white">Internal URL</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2">
              <span className="font-mono text-sm text-neutral-300 flex-1 truncate">
                {domainSettings.internalUrl || "Not configured"}
              </span>
              {domainSettings.internalUrl && (
                <button onClick={() => navigator.clipboard.writeText(domainSettings.internalUrl)}
                  className="text-xs text-neutral-500 hover:text-amber-400 transition-colors">
                  Copy
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#111114] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Custom Domains</h2>
          {isFree && !isMicro && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Pro</span>
          )}
        </div>
        <div className="p-5 space-y-3">
          {customDomains.length === 0 && !showAddForm && (
            <p className="text-sm text-neutral-500">No custom domains configured.</p>
          )}
          {customDomains.map((domain) => (
            <div key={domain} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="font-mono text-sm text-white truncate">{domain}</span>
                <span className="text-xs text-green-400">Active</span>
              </div>
              {canManageCustom && (
                <button onClick={() => removeCustomDomain(domain)} disabled={customDomainRemoving === domain}
                  className="text-xs text-neutral-500 hover:text-red-400 transition disabled:opacity-50">
                  {customDomainRemoving === domain ? "Removing…" : "Remove"}
                </button>
              )}
            </div>
          ))}

          {canManageCustom && (
            <>
              {showAddForm ? (
                <div className="pt-3 space-y-3 border-t border-white/[0.06]">
                  <input
                    type="text"
                    value={newCustomDomain}
                    onChange={(e) => setNewCustomDomain(e.target.value)}
                    placeholder="api.example.com"
                    disabled={customDomainSaving}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white focus:border-amber-500/50 outline-none disabled:opacity-50"
                  />
                  <div className="flex gap-2">
                    <button onClick={addCustomDomain} disabled={!newCustomDomain.trim() || customDomainSaving}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold disabled:opacity-50">
                      {customDomainSaving ? "Adding…" : "Add Domain"}
                    </button>
                    <button onClick={() => { setShowAddForm(false); setNewCustomDomain(""); }}
                      className="px-4 py-2 rounded-lg border border-white/10 text-neutral-400 text-xs font-medium hover:bg-white/5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddForm(true)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
                  + Add domain
                </button>
              )}
            </>
          )}

          {isFree && !isMicro && (
            <p className="text-xs text-neutral-500 pt-2">Custom domains are available on the Pro plan.</p>
          )}
        </div>
      </section>

      {customDomains.length > 0 && canManageCustom && (
        <section className="bg-[#111114] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-medium text-white">DNS Records</h2>
            <p className="text-xs text-neutral-500 mt-1">Configure these records at your domain provider</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="py-3 px-5 font-medium">Type</th>
                  <th className="py-3 px-5 font-medium">Name</th>
                  <th className="py-3 px-5 font-medium">Value</th>
                  <th className="py-3 px-5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {DNS_RECORDS.map((rec, i) => (
                  <tr key={i} className="border-b border-white/[0.06] last:border-0">
                    <td className="py-3 px-5 text-neutral-300">{rec.type}</td>
                    <td className="py-3 px-5 text-neutral-400">{rec.name}</td>
                    <td className="py-3 px-5 text-neutral-300">{rec.value}</td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.status === 'active' ? 'bg-green-500' : rec.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="text-neutral-400 capitalize">{rec.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
