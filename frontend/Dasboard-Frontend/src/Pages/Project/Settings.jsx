import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/apiclient";

// ─── tiny helpers ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/40 ${value ? "bg-[#adc6ff]" : "bg-[#2d3449]"}`}
        >
            <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 ${value ? "left-[calc(100%-20px)] bg-[#00285d]" : "left-1 bg-[#424754]"}`}
            />
        </button>
    );
}

function SectionHeader({ icon, label, right }) {
    return (
        <div className="px-5 py-3 border-b border-[#424754] bg-[#1c2438] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">{icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#c2c6d6]">{label}</span>
            </div>
            {right}
        </div>
    );
}

function FieldLabel({ children }) {
    return <label className="block text-[11px] font-bold uppercase tracking-widest text-[#8891a8] mb-1.5">{children}</label>;
}

function MonoInput({ icon, ...props }) {
    return (
        <div className="relative">
            {icon && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#424754] text-[16px]">{icon}</span>
            )}
            <input
                className={`w-full bg-[#0b1326] border border-[#2d3449] rounded-lg py-2 font-mono text-sm text-[#dae2fd] placeholder-[#424754] focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff]/30 outline-none transition-all ${icon ? "pl-9 pr-3" : "px-3"}`}
                {...props}
            />
        </div>
    );
}

// Save button states
function SaveBtn({ saving, saved, onClick, label = "Save" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:cursor-not-allowed
                ${saved
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20 hover:bg-[#adc6ff]/20"
                } disabled:opacity-50`}
        >
            {saving ? (
                <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
            ) : saved ? (
                <span className="material-symbols-outlined text-[15px]">check</span>
            ) : (
                <span className="material-symbols-outlined text-[15px]">save</span>
            )}
            {saving ? "Saving…" : saved ? "Saved" : label}
        </button>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export function Settings() {
    const { id: projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectPlan, setProjectPlan] = useState("free");

    // General (read-only display)
    const [projectName, setProjectName] = useState("");
    const [projectType, setProjectType] = useState("node");
    const [repoUrl, setRepoUrl] = useState("");
    const [branch, setBranch] = useState("master");

    // Build & start
    const [rootDirectory, setRootDirectory] = useState(".");
    const [startCommand, setStartCommand] = useState("");
    const [port, setPort] = useState(3000);
    const [publishDir, setPublishDir] = useState("");
    const [buildCommand, setBuildCommand] = useState("");
    const [savingBuild, setSavingBuild] = useState(false);
    const [savedBuild, setSavedBuild] = useState(false);

    // Env vars
    const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);
    const [savingEnv, setSavingEnv] = useState(false);
    const [savedEnv, setSavedEnv] = useState(false);

    // Monitor
    const [monitorEnabled, setMonitorEnabled] = useState(false);
    const [intervalSeconds, setIntervalSeconds] = useState(60);
    const [healthPath, setHealthPath] = useState("/health");
    const [failedTries, setFailedTries] = useState(2);

    // Notifications
    const [discordEnabled, setDiscordEnabled] = useState(false);
    const [discordWebhook, setDiscordWebhook] = useState("");
    const [telegramEnabled, setTelegramEnabled] = useState(false);
    const [telegramBotToken, setTelegramBotToken] = useState("");
    const [telegramChatId, setTelegramChatId] = useState("");
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [emailAddress, setEmailAddress] = useState("");
    const [savingNotif, setSavingNotif] = useState(false);
    const [savedNotif, setSavedNotif] = useState(false);
    const [notifError, setNotifError] = useState(null);

    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmName, setConfirmName] = useState("");
    const [deleting, setDeleting] = useState(false);

    // ── fetch ────────────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/project/settings/${projectId}`);
                const s = response.data.settings;

                setProjectName(s.projectName || "");
                setProjectType(s.projectType || "node");
                setRepoUrl(s.repoUrl || "");
                setBranch(s.branch || "master");
                setProjectPlan(s.projectPlan || "free");

                setRootDirectory(s.rootDirectory || ".");
                if (s.startCommand) setStartCommand(s.startCommand);
                if (s.port) setPort(s.port);
                if (s.publishDir) setPublishDir(s.publishDir);
                if (s.buildCommand) setBuildCommand(s.buildCommand);

                if (s.monitor) {
                    setMonitorEnabled(s.monitor.enabled || false);
                    setIntervalSeconds(s.monitor.intervalSeconds || 60);
                    setHealthPath(s.monitor.healthPath || "/health");
                    setFailedTries(s.monitor.failedTries || 2);
                }

                if (s.notifications) {
                    const n = s.notifications;
                    if (n.discord) { setDiscordEnabled(n.discord.enabled || false); setDiscordWebhook(n.discord.webhookUrl || ""); }
                    if (n.telegram) { setTelegramEnabled(n.telegram.enabled || false); setTelegramBotToken(n.telegram.botToken || ""); setTelegramChatId(n.telegram.chatId || ""); }
                    if (n.email) { setEmailEnabled(n.email.enabled || false); setEmailAddress(n.email.emailAddress || ""); }
                }

                // env is [{key, encryptedValue}] from backend — show keys only, values masked
                if (s.env && typeof s.env === "object") {
                    setEnvVars(
                        Object.entries(s.env).map(([key, value]) => ({
                            key,
                            value
                        }))
                    );
                }
            } catch {
                setError("Failed to load project settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [projectId]);

    // ── save: build & start ──────────────────────────────────────────────────

    const handleSaveBuild = async () => {
        setSavingBuild(true);
        setSavedBuild(false);
        try {
            await api.patch(`/project/settings/build-and-start/${projectId}`, {
                buildCommand,
                publishDir,
                startCommand,
                port,
                rootDirectory,
            });
            setSavedBuild(true);
            setTimeout(() => setSavedBuild(false), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save build settings.");
        } finally {
            setSavingBuild(false);
        }
    };

    // ── save: env vars ───────────────────────────────────────────────────────

    const handleSaveEnv = async () => {
        setSavingEnv(true);
        setSavedEnv(false);
        const env = envVars.reduce((acc, { key, value }) => {
            if (key.trim() && value.trim()) acc[key.trim()] = value.trim();
            return acc;
        }, {});
        try {
            await api.patch(`/project/settings/env/${projectId}`, { env });
            setSavedEnv(true);
            setTimeout(() => setSavedEnv(false), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save environment variables.");
        } finally {
            setSavingEnv(false);
        }
    };

    // ── save: notifications & monitor ────────────────────────────────────────

    const handleSaveNotif = async () => {
        setNotifError(null);
        setSavingNotif(true);
        setSavedNotif(false);

        // client-side guard for pro plan
        if (monitorEnabled && projectPlan !== "pro") {
            setNotifError("Health monitoring requires a Pro plan.");
            setSavingNotif(false);
            return;
        }

        try {
            await api.patch(`/project/settings/notification/${projectId}`, {
                projectPlan,
                monitor: { enabled: monitorEnabled, intervalSeconds, healthPath, failedTries },
                notifications: {
                    discord: { enabled: discordEnabled, webhookUrl: discordEnabled ? discordWebhook : undefined },
                    telegram: { enabled: telegramEnabled, botToken: telegramEnabled ? telegramBotToken : undefined, chatId: telegramEnabled ? telegramChatId : undefined },
                    email: { enabled: emailEnabled, emailAddress: emailEnabled ? emailAddress : undefined },
                },
            });
            setSavedNotif(true);
            setTimeout(() => setSavedNotif(false), 3000);
        } catch (err) {
            setNotifError(err?.response?.data?.message || "Failed to save notification settings.");
        } finally {
            setSavingNotif(false);
        }
    };

    // ── env helpers ──────────────────────────────────────────────────────────

    const handleEnvChange = (i, field, val) => {
        const updated = [...envVars];
        updated[i][field] = val;
        setEnvVars(updated);
    };
    const addEnvRow = () => setEnvVars([...envVars, { key: "", value: "" }]);
    const removeEnvRow = (i) => envVars.length > 1 && setEnvVars(envVars.filter((_, idx) => idx !== i));

    // ── delete ───────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (confirmName !== projectName) return;
        setDeleting(true);
        try {
            await api.delete(`/project/${projectId}`);
            window.location.href = "/";
        } catch {
            setError("Failed to delete project.");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // ── loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#adc6ff]">progress_activity</span>
            </div>
        );
    }

    // ── render ───────────────────────────────────────────────────────────────

    return (
        <main className="min-h-screen">
            <div className="p-6 max-w-[900px] mx-auto space-y-5">

                {/* ── Page Header ── */}
                <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-[#424754] mb-1">
                        <span className="text-[11px] uppercase tracking-widest font-bold">Project Settings</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-[11px] font-bold text-[#adc6ff]">{projectName}</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h1 className="text-xl font-semibold text-[#dae2fd] tracking-tight">Configuration</h1>
                        {projectPlan === "pro" && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 text-[#adc6ff] rounded-full">Pro</span>
                        )}
                    </div>
                </div>

                {/* global error */}
                {error && (
                    <div className="bg-[#93000a]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto material-symbols-outlined text-[16px] opacity-60 hover:opacity-100">close</button>
                    </div>
                )}

                {/* ── General (read-only) ── */}
                <section className="bg-[#131929] rounded-xl border border-[#252d42] overflow-hidden">
                    <SectionHeader icon="info" label="General" />
                    <div className="p-5 grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Project Name</FieldLabel>
                            <MonoInput icon="tag" value={projectName} onChange={e => setProjectName(e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel>Project Type</FieldLabel>
                            <div className="flex items-center gap-2 bg-[#0b1326] border border-[#2d3449] rounded-lg px-3 py-2">
                                <span className="material-symbols-outlined text-[#adc6ff] text-[16px]">{projectType === "static" ? "html" : "terminal"}</span>
                                <span className="font-mono text-sm text-[#8891a8] capitalize">{projectType}</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <FieldLabel>Repository</FieldLabel>
                            <div className="flex items-center gap-2 bg-[#0b1326] border border-[#2d3449] rounded-lg px-3 py-2">
                                <span className="material-symbols-outlined text-[#424754] text-[16px]">account_tree</span>
                                <span className="font-mono text-sm text-[#dae2fd] flex-1 truncate">{repoUrl}</span>
                                <span className="px-2 py-0.5 bg-[#1c2438] border border-[#2d3449] rounded text-[11px] font-bold text-[#adc6ff]">{branch}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Build & Start ── */}
                <section className="bg-[#131929] rounded-xl border border-[#252d42] overflow-hidden">
                    <SectionHeader
                        icon="build"
                        label={projectType === "static" ? "Build & Output" : "Start Command & Port"}
                        right={<SaveBtn saving={savingBuild} saved={savedBuild} onClick={handleSaveBuild} />}
                    />
                    <div className="p-5">
                        {projectType === "static" ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <FieldLabel>Root Directory</FieldLabel>
                                    <MonoInput icon="folder" value={rootDirectory} onChange={e => setRootDirectory(e.target.value)} placeholder="." />
                                </div>
                                <div>
                                    <FieldLabel>Build Command</FieldLabel>
                                    <MonoInput icon="terminal" value={buildCommand} onChange={e => setBuildCommand(e.target.value)} placeholder="npm run build" />
                                </div>
                                <div>
                                    <FieldLabel>Publish Directory</FieldLabel>
                                    <MonoInput icon="output" value={publishDir} onChange={e => setPublishDir(e.target.value)} placeholder="dist" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <FieldLabel>Root Directory</FieldLabel>
                                    <MonoInput icon="folder" value={rootDirectory} onChange={e => setRootDirectory(e.target.value)} placeholder="." />
                                </div>
                                <div>
                                    <FieldLabel>Start Command</FieldLabel>
                                    <MonoInput icon="play_arrow" value={startCommand} onChange={e => setStartCommand(e.target.value)} placeholder="node index.js" />
                                </div>
                                <div>
                                    <FieldLabel>Port</FieldLabel>
                                    <MonoInput icon="lan" type="number" value={port} onChange={e => setPort(parseInt(e.target.value) || 3000)} />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Environment Variables ── */}
                <section className="bg-[#131929] rounded-xl border border-[#252d42] overflow-hidden">
                    <SectionHeader
                        icon="key"
                        label="Environment Variables"
                        right={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={addEnvRow}
                                    className="px-3 py-1 bg-[#1c2438] border border-[#2d3449] text-[#adc6ff] rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:border-[#adc6ff]/40 transition"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add
                                </button>
                                <SaveBtn saving={savingEnv} saved={savedEnv} onClick={handleSaveEnv} />
                            </div>
                        }
                    />
                    <div className="p-5 space-y-2">
                        {envVars.length === 0 && (
                            <p className="text-[#424754] text-xs font-mono text-center py-4">No environment variables. Click Add to create one.</p>
                        )}
                        {envVars.map((env, idx) => (
                            <div key={idx} className="flex gap-2 items-center group">
                                <input
                                    type="text"
                                    placeholder="KEY"
                                    value={env.key}
                                    onChange={e => handleEnvChange(idx, "key", e.target.value)}
                                    className="w-44 bg-[#0b1326] border border-[#2d3449] rounded-lg px-3 py-2 font-mono text-sm text-[#adc6ff] placeholder-[#2d3449] focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff]/30 outline-none"
                                />
                                <span className="text-[#2d3449] font-mono text-sm">=</span>
                                <input
                                    type="text"
                                    placeholder="value"
                                    value={env.value}
                                    onChange={e => handleEnvChange(idx, "value", e.target.value)}
                                    className="flex-1 bg-[#0b1326] border border-[#2d3449] rounded-lg px-3 py-2 font-mono text-sm text-[#dae2fd] placeholder-[#2d3449] focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff]/30 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeEnvRow(idx)}
                                    disabled={envVars.length === 1}
                                    className="opacity-0 group-hover:opacity-100 text-[#424754] hover:text-[#ffb4ab] transition disabled:opacity-20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                                </button>
                            </div>
                        ))}
                        <p className="text-[10px] text-[#424754] font-mono pt-1">
                            Existing values are encrypted — enter new value to update, leave blank to keep current.
                        </p>
                    </div>
                </section>

                {/* ── Monitoring & Notifications ── */}
                <section className="bg-[#131929] rounded-xl border border-[#252d42] overflow-hidden">
                    <SectionHeader
                        icon="notifications_active"
                        label="Monitoring & Alerts"
                        right={<SaveBtn saving={savingNotif} saved={savedNotif} onClick={handleSaveNotif} label="Save" />}
                    />

                    {notifError && (
                        <div className="mx-5 mt-4 bg-[#93000a]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] px-3 py-2 rounded-lg flex items-center gap-2 text-xs">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {notifError}
                        </div>
                    )}

                    <div className="p-5 space-y-5">
                        {/* Health Monitor — node only */}
                        {projectType !== "static" && (
                            <div className="rounded-lg border border-[#252d42] overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 bg-[#0f1624]">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">monitoring</span>
                                        <span className="text-sm font-semibold text-[#dae2fd]">Health Monitoring</span>
                                        {projectPlan !== "pro" && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-[#adc6ff]/5 border border-[#adc6ff]/20 text-[#adc6ff]/60 rounded">Pro</span>
                                        )}
                                    </div>
                                    <Toggle
                                        value={monitorEnabled}
                                        onChange={v => {
                                            if (v && projectPlan !== "pro") {
                                                setNotifError("Upgrade to Pro to enable health monitoring.");
                                                return;
                                            }
                                            setNotifError(null);
                                            setMonitorEnabled(v);
                                        }}
                                    />
                                </div>
                                {monitorEnabled && (
                                    <div className="px-4 py-4 grid grid-cols-3 gap-4 border-t border-[#252d42] bg-[#0b1326]/40">
                                        <div>
                                            <FieldLabel>Interval (sec)</FieldLabel>
                                            <MonoInput type="number" value={intervalSeconds} onChange={e => setIntervalSeconds(parseInt(e.target.value) || 60)} />
                                        </div>
                                        <div>
                                            <FieldLabel>Health Path</FieldLabel>
                                            <MonoInput value={healthPath} onChange={e => setHealthPath(e.target.value)} placeholder="/health" />
                                        </div>
                                        <div>
                                            <FieldLabel>Failed Tries</FieldLabel>
                                            <MonoInput type="number" value={failedTries} onChange={e => setFailedTries(parseInt(e.target.value) || 2)} />
                                        </div>
                                    </div>
                                )}
                                {!monitorEnabled && (
                                    <div className="px-4 py-3 border-t border-[#252d42] bg-[#0b1326]/20">
                                        <p className="text-xs text-[#424754] font-mono">
                                            {projectPlan !== "pro"
                                                ? "Upgrade to Pro to monitor your service's health endpoint automatically."
                                                : "Enable to periodically ping your health endpoint and alert on failures."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="rounded-lg border border-[#252d42] overflow-hidden divide-y divide-[#1c2438]">

                            {/* Discord */}
                            <div>
                                <div className="flex items-center justify-between px-4 py-3 hover:bg-[#0b1326]/40 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#424754] text-[18px]">forum</span>
                                        <span className="text-sm text-[#c2c6d6]">Discord</span>
                                    </div>
                                    <Toggle value={discordEnabled} onChange={setDiscordEnabled} />
                                </div>
                                {discordEnabled && (
                                    <div className="px-4 pb-3 bg-[#0b1326]/30">
                                        <FieldLabel>Webhook URL</FieldLabel>
                                        <MonoInput
                                            type="url"
                                            value={discordWebhook}
                                            onChange={e => setDiscordWebhook(e.target.value)}
                                            placeholder="https://discord.com/api/webhooks/…"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Telegram */}
                            <div>
                                <div className="flex items-center justify-between px-4 py-3 hover:bg-[#0b1326]/40 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#424754] text-[18px]">send</span>
                                        <span className="text-sm text-[#c2c6d6]">Telegram</span>
                                    </div>
                                    <Toggle value={telegramEnabled} onChange={setTelegramEnabled} />
                                </div>
                                {telegramEnabled && (
                                    <div className="px-4 pb-3 bg-[#0b1326]/30 grid grid-cols-2 gap-3">
                                        <div>
                                            <FieldLabel>Bot Token</FieldLabel>
                                            <MonoInput value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} placeholder="123456:ABC-…" />
                                        </div>
                                        <div>
                                            <FieldLabel>Chat ID</FieldLabel>
                                            <MonoInput value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="-100…" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <div className="flex items-center justify-between px-4 py-3 hover:bg-[#0b1326]/40 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">mail</span>
                                        <div>
                                            <span className="text-sm text-[#c2c6d6]">Email</span>
                                            {emailEnabled && emailAddress && (
                                                <span className="ml-2 font-mono text-[11px] text-[#424754]">{emailAddress}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Toggle value={emailEnabled} onChange={setEmailEnabled} />
                                </div>
                                {emailEnabled && (
                                    <div className="px-4 pb-3 bg-[#0b1326]/30">
                                        <FieldLabel>Email Address</FieldLabel>
                                        <MonoInput
                                            type="email"
                                            value={emailAddress}
                                            onChange={e => setEmailAddress(e.target.value)}
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Danger Zone ── */}
                <section className="bg-[#93000a]/5 rounded-xl border border-[#ffb4ab]/15 overflow-hidden mt-8">
                    <SectionHeader icon="warning" label="Danger Zone" />
                    <div className="p-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-[#dae2fd]">Delete Project</p>
                            <p className="text-xs text-[#8891a8] mt-0.5">Permanently deletes this project and all its data. Cannot be undone.</p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-5 py-2 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#ffb4ab]/20 transition whitespace-nowrap"
                        >
                            Delete Project
                        </button>
                    </div>
                </section>
            </div>

            {/* ── Delete Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#131929] border border-[#252d42] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">warning</span>
                            <h2 className="text-base font-semibold text-[#dae2fd]">Delete Project</h2>
                        </div>
                        <p className="text-xs text-[#8891a8] mb-4">
                            Type <span className="font-mono text-[#adc6ff] bg-[#0b1326] px-1 py-0.5 rounded">{projectName}</span> to confirm.
                        </p>
                        <input
                            type="text"
                            value={confirmName}
                            onChange={e => setConfirmName(e.target.value)}
                            placeholder={projectName}
                            className="w-full bg-[#0b1326] border border-[#2d3449] rounded-lg px-3 py-2 font-mono text-sm text-[#dae2fd] mb-4 focus:border-[#ffb4ab]/50 focus:ring-1 focus:ring-[#ffb4ab]/20 outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowDeleteModal(false); setConfirmName(""); }}
                                className="px-4 py-2 border border-[#252d42] rounded-lg text-[11px] font-bold uppercase tracking-widest text-[#8891a8] hover:bg-[#1c2438] transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={confirmName !== projectName || deleting}
                                className="px-4 py-2 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#ffb4ab]/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {deleting
                                    ? <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
                                    : <span className="material-symbols-outlined text-[15px]">delete</span>
                                }
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}