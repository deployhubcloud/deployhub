import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/apiclient";

export function Domain() {
    const { id: projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Domain state
    const [domainSettings, setDomainSettings] = useState(null);
    const [originalSubdomain, setOriginalSubdomain] = useState("");
    const [newSubdomain, setNewSubdomain] = useState("");

    // Custom domains management (UI only – no API yet)
    const [customDomains, setCustomDomains] = useState([]);
    const [newCustomDomain, setNewCustomDomain] = useState("");

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
            } catch (err) {
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
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setError("Failed to update subdomain.");
        } finally {
            setSaving(false);
        }
    };

    const addCustomDomain = () => {
        const domain = newCustomDomain.trim().toLowerCase();
        if (!domain || customDomains.includes(domain)) return;
        setCustomDomains([...customDomains, domain]);
        setNewCustomDomain("");
        // In future: call API to add custom domain
    };

    const removeCustomDomain = (domain) => {
        setCustomDomains(customDomains.filter(d => d !== domain));
        // In future: call API to delete custom domain
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#adc6ff]">
                    progress_activity
                </span>
            </div>
        );
    }

    if (!domainSettings) {
        return (
            <div className="p-6 text-center text-[#c2c6d6]">
                <span className="material-symbols-outlined text-[48px] text-[#ffb4ab]">error</span>
                <p className="mt-4">Could not load domain settings.</p>
            </div>
        );
    }

    const isMicro = domainSettings.isMicroservice;
    const isFree = domainSettings.plan === "free";
    const canEditSubdomain = !isMicro;          // microservices subdomain read-only
    const canManageCustom = !isFree && !isMicro; // free plan blocks all custom domains, microservices read-only

    return (
        <main className="min-h-screen">
            <div className="p-6 max-w-[800px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-[#c2c6d6] mb-1">
                        <span className="text-xs uppercase tracking-wider font-semibold">Domain Settings</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span className="text-xs font-semibold">Manage</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-[#dae2fd]">Domains & URLs</h3>
                    <p className="text-sm text-[#c2c6d6] mt-1">
                        {isMicro ? "Microservice – read-only configuration" : "Configure how your project is accessed"}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-[#93000a]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] px-4 py-2 rounded flex items-center gap-2">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 bg-green-900/10 border border-green-500/30 text-green-400 px-4 py-2 rounded flex items-center gap-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        {successMessage}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Subdomain Section */}
                    <section className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                        <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#adc6ff]">language</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">DeployHub Subdomain</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">Subdomain</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={newSubdomain}
                                        onChange={(e) => setNewSubdomain(e.target.value)}
                                        disabled={!canEditSubdomain}
                                        className={`flex-1 bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm text-[#dae2fd] focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all ${!canEditSubdomain ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                    />
                                    <span className="text-[#c2c6d6] text-sm">.deployhub.online</span>
                                </div>
                                {isMicro && (
                                    <p className="mt-2 text-xs text-[#c2c6d6] opacity-70 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">info</span>
                                        Subdomain cannot be changed for microservices
                                    </p>
                                )}
                                {!isMicro && newSubdomain !== originalSubdomain && (
                                    <button
                                        onClick={handleSubdomainSave}
                                        disabled={saving || !newSubdomain.trim()}
                                        className="mt-3 px-6 py-1.5 bg-[#adc6ff] text-[#00285d] rounded text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(173,198,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">save</span>
                                        )}
                                        {saving ? "Saving..." : "Save Subdomain"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Internal URL (only for microservices) */}
                    {isMicro && (
                        <section className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                            <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#adc6ff]">dns</span>
                                <span className="text-xs font-semibold uppercase tracking-wider">Internal URL</span>
                            </div>
                            <div className="p-6">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">Service Endpoint</label>
                                <div className="flex items-center gap-2 bg-[#0b1326] border border-[#424754] rounded p-2">
                                    <span className="font-mono text-sm text-[#dae2fd] flex-1 truncate">
                                        {domainSettings.internalUrl || "Not configured"}
                                    </span>
                                    {domainSettings.internalUrl && (
                                        <button
                                            onClick={() => navigator.clipboard.writeText(domainSettings.internalUrl)}
                                            className="material-symbols-outlined text-[#c2c6d6] hover:text-[#adc6ff]"
                                            title="Copy URL"
                                        >
                                            content_copy
                                        </button>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-[#c2c6d6] opacity-70 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                    Internal communication URL, not publicly accessible
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Custom Domains */}
                    <section className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                        <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#adc6ff]">public</span>
                                <span className="text-xs font-semibold uppercase tracking-wider">Custom Domains</span>
                            </div>
                            {isFree && !isMicro && (
                                <span className="px-2 py-0.5 bg-[#adc6ff]/10 text-[#adc6ff] rounded text-xs font-semibold uppercase flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                    Pro Feature
                                </span>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            {customDomains.length === 0 && (
                                <p className="text-sm text-[#c2c6d6] opacity-70">No custom domains configured.</p>
                            )}
                            {customDomains.map((domain) => (
                                <div key={domain} className="flex items-center justify-between p-3 bg-[#0b1326] border border-[#424754] rounded-lg">
                                    <span className="font-mono text-sm text-[#dae2fd]">{domain}</span>
                                    {canManageCustom && (
                                        <button
                                            onClick={() => removeCustomDomain(domain)}
                                            className="material-symbols-outlined text-[#c2c6d6] hover:text-[#ffb4ab] transition"
                                        >
                                            delete
                                        </button>
                                    )}
                                    {!canManageCustom && (
                                        <span className="text-xs text-[#c2c6d6] opacity-50">read-only</span>
                                    )}
                                </div>
                            ))}

                            {/* Add new custom domain (only if allowed) */}
                            {canManageCustom && (
                                <div className="flex gap-3 mt-4">
                                    <input
                                        type="text"
                                        value={newCustomDomain}
                                        onChange={(e) => setNewCustomDomain(e.target.value)}
                                        placeholder="api.example.com"
                                        className="flex-1 bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm text-[#dae2fd] focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none"
                                    />
                                    <button
                                        onClick={addCustomDomain}
                                        disabled={!newCustomDomain.trim()}
                                        className="px-6 py-2 bg-[#adc6ff]/10 text-[#adc6ff] rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#adc6ff]/20 transition disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {isFree && !isMicro && (
                                <div className="mt-3 p-3 bg-[#adc6ff]/5 border border-[#adc6ff]/20 rounded-lg flex items-start gap-2">
                                    <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">info</span>
                                    <p className="text-xs text-[#c2c6d6]">
                                        Custom domains are available on the <strong>Pro</strong> plan.{" "}
                                        <a href="/upgrade" className="text-[#adc6ff] underline hover:no-underline">Upgrade now</a>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}