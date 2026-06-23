import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/apiclient";

export function Settings() {
    const { id: projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Form state
    const [projectName, setProjectName] = useState("");
    const [projectType, setProjectType] = useState("node");
    const [repoUrl, setRepoUrl] = useState("");
    const [branch, setBranch] = useState("master");
    const [rootDirectory, setRootDirectory] = useState(".");

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

    // Project-type specific
    const [startCommand, setStartCommand] = useState("");
    const [port, setPort] = useState(3000);
    const [publishDir, setPublishDir] = useState("");
    const [buildCommand, setBuildCommand] = useState("");

    // Environment variables
    const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmName, setConfirmName] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/project/settings/${projectId}`);
                const s = response.data.settings; // adjust if your API returns differently

                setProjectName(s.projectName || "");
                setProjectType(s.projectType || "node");
                setRepoUrl(s.repoUrl || "");
                setBranch(s.branch || "master");
                setRootDirectory(s.rootDirectory || ".");

                if (s.monitor) {
                    setMonitorEnabled(s.monitor.enabled || false);
                    setIntervalSeconds(s.monitor.intervalSeconds || 60);
                    setHealthPath(s.monitor.healthPath || "/health");
                    setFailedTries(s.monitor.failedTries || 2);
                }

                if (s.notifications) {
                    if (s.notifications.discord) {
                        setDiscordEnabled(s.notifications.discord.enabled || false);
                        setDiscordWebhook(s.notifications.discord.webhookUrl || "");
                    }
                    if (s.notifications.telegram) {
                        setTelegramEnabled(s.notifications.telegram.enabled || false);
                        setTelegramBotToken(s.notifications.telegram.botToken || "");
                        setTelegramChatId(s.notifications.telegram.chatId || "");
                    }
                    if (s.notifications.email) {
                        setEmailEnabled(s.notifications.email.enabled || false);
                        setEmailAddress(s.notifications.email.emailAddress || "");
                    }
                }

                if (s.startCommand) setStartCommand(s.startCommand);
                if (s.port) setPort(s.port);
                if (s.publishDir) setPublishDir(s.publishDir);
                if (s.buildCommand) setBuildCommand(s.buildCommand);

                if (s.env && typeof s.env === "object") {
                    const envArray = Object.entries(s.env).map(([key, value]) => ({ key, value }));
                    setEnvVars(envArray.length ? envArray : [{ key: "", value: "" }]);
                }
            } catch (err) {
                setError("Failed to load project settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [projectId]);

    const handleEnvChange = (index, field, value) => {
        const updated = [...envVars];
        updated[index][field] = value;
        setEnvVars(updated);
    };

    const addEnvRow = () => setEnvVars([...envVars, { key: "", value: "" }]);
    const removeEnvRow = (index) => {
        if (envVars.length === 1) return;
        const updated = envVars.filter((_, i) => i !== index);
        setEnvVars(updated);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage("");
        setSaving(true);

        const envObject = envVars.reduce((acc, { key, value }) => {
            if (key.trim()) acc[key.trim()] = value;
            return acc;
        }, {});

        const payload = {
            projectName,
            projectType,
            repoUrl,
            branch,
            rootDirectory,
            monitor: {
                enabled: monitorEnabled,
                intervalSeconds,
                healthPath,
                failedTries,
            },
            notifications: {
                discord: {
                    enabled: discordEnabled,
                    webhookUrl: discordEnabled ? discordWebhook : null,
                },
                telegram: {
                    enabled: telegramEnabled,
                    botToken: telegramEnabled ? telegramBotToken : null,
                    chatId: telegramEnabled ? telegramChatId : null,
                },
                email: {
                    enabled: emailEnabled,
                    emailAddress: emailEnabled ? emailAddress : null,
                },
            },
            env: envObject,
            ...(projectType === "static"
                ? { publishDir, buildCommand }
                : { startCommand, port }),
        };

        try {
            await api.updateProjectSettings(projectId, payload);
            setSuccessMessage("Settings saved successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setError("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirmName !== projectName) return;
        setDeleting(true);
        try {
            await api.delete(`/project/${projectId}`);
            window.location.href = '/';
        } catch (err) {
            setError("Failed to delete project.");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
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

    return (
        <main className="min-h-screen">
            <div className="p-6 max-w-[1200px] mx-auto">
                {/* Page Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 text-[#c2c6d6] mb-1">
                            <span className="text-xs uppercase tracking-wider font-semibold">Project Settings</span>
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            <span className="text-xs font-semibold">{projectName}</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-[#dae2fd]">Configuration</h3>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2 bg-[#adc6ff] text-[#00285d] rounded text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(173,198,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">save</span>
                            )}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
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
                    {/* Section 1: General Details (full width) */}
                    <section className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                        <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#adc6ff]">info</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">General Details</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">Project Name</label>
                                    <input
                                        className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">Project Type</label>
                                    <div className="flex items-center gap-2 bg-[#0b1326] border border-[#424754] rounded p-2">
                                        <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">
                                            {projectType === "static" ? "html" : "terminal"}
                                        </span>
                                        <span className="font-mono text-sm capitalize">{projectType} (v24)</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] mb-1">Repository Source</label>
                                <div className="flex items-center gap-2 bg-[#0b1326] border border-[#424754] rounded p-2">
                                    <span className="material-symbols-outlined text-[#c2c6d6]">account_tree</span>
                                    <span className="font-mono text-sm flex-1 text-[#dae2fd] truncate">{repoUrl}</span>
                                    <span className="px-1 py-0.5 bg-[#2d3449] rounded text-xs font-semibold text-[#adc6ff]">{branch}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Build & Deployment Settings */}
                    <section className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                        <div className="p-4 border-b border-[#424754] bg-[#222a3d] border-t-2 border-[#adc6ff] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#adc6ff]">build</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                {projectType === "static" ? "Build & Output Settings" : "Start Command & Port"}
                            </span>
                        </div>
                        <div className="p-6">
                            {projectType === "static" ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Root Directory</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c2c6d6] text-[18px]">folder</span>
                                            <input
                                                className="w-full bg-[#0b1326] border border-[#424754] rounded pl-10 pr-2 py-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                                                type="text"
                                                value={rootDirectory}
                                                onChange={(e) => setRootDirectory(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs font-semibold text-[#c2c6d6] opacity-60">Directory where the source code resides.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Build Command</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c2c6d6] text-[18px]">terminal</span>
                                            <input
                                                className="w-full bg-[#0b1326] border border-[#424754] rounded pl-10 pr-2 py-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                                                type="text"
                                                value={buildCommand}
                                                onChange={(e) => setBuildCommand(e.target.value)}
                                                placeholder="npm run build"
                                            />
                                        </div>
                                        <p className="text-xs font-semibold text-[#c2c6d6] opacity-60">Command used to generate the build assets.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Publish Directory</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c2c6d6] text-[18px]">output</span>
                                            <input
                                                className="w-full bg-[#0b1326] border border-[#424754] rounded pl-10 pr-2 py-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                                                type="text"
                                                value={publishDir}
                                                onChange={(e) => setPublishDir(e.target.value)}
                                                placeholder="dist"
                                            />
                                        </div>
                                        <p className="text-xs font-semibold text-[#c2c6d6] opacity-60">Folder that contains the static output files.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Start Command</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c2c6d6] text-[18px]">play_arrow</span>
                                            <input
                                                className="w-full bg-[#0b1326] border border-[#424754] rounded pl-10 pr-2 py-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                                                type="text"
                                                value={startCommand}
                                                onChange={(e) => setStartCommand(e.target.value)}
                                                placeholder="node index.js"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Port</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c2c6d6] text-[18px]">lan</span>
                                            <input
                                                className="w-full bg-[#0b1326] border border-[#424754] rounded pl-10 pr-2 py-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none transition-all"
                                                type="number"
                                                value={port}
                                                onChange={(e) => setPort(parseInt(e.target.value) || 3000)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Environment Variables */}
                    <section className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                        <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#adc6ff]">key</span>
                                <span className="text-xs font-semibold uppercase tracking-wider">Environment Variables</span>
                            </div>
                            <button
                                type="button"
                                onClick={addEnvRow}
                                className="px-4 py-1 bg-[#adc6ff]/10 text-[#adc6ff] rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 hover:bg-[#adc6ff]/20 transition"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span> Add
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {envVars.map((env, idx) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        placeholder="KEY"
                                        value={env.key}
                                        onChange={(e) => handleEnvChange(idx, "key", e.target.value)}
                                        className="flex-1 bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="value"
                                        value={env.value}
                                        onChange={(e) => handleEnvChange(idx, "value", e.target.value)}
                                        className="flex-1 bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeEnvRow(idx)}
                                        disabled={envVars.length === 1}
                                        className="text-[#c2c6d6] hover:text-[#ffb4ab] transition disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 3 & 4: Monitoring & Notifications */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Monitoring – only for non-static */}
                        {projectType !== "static" && (
                            <div className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                                <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#adc6ff]">monitoring</span>
                                        <span className="text-xs font-semibold uppercase tracking-wider">Health Monitoring</span>
                                    </div>
                                    <button
                                        onClick={() => setMonitorEnabled(!monitorEnabled)}
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${monitorEnabled ? "bg-[#adc6ff]" : "bg-[#2d3449]"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 ${monitorEnabled ? "left-[calc(100%-20px)] bg-white" : "left-1 bg-[#424754]"
                                                }`}
                                        ></span>
                                    </button>
                                </div>
                                <div className="p-6">
                                    {monitorEnabled ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Interval (s)</label>
                                                <input
                                                    type="number"
                                                    value={intervalSeconds}
                                                    onChange={(e) => setIntervalSeconds(parseInt(e.target.value) || 60)}
                                                    className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Health Path</label>
                                                <input
                                                    type="text"
                                                    value={healthPath}
                                                    onChange={(e) => setHealthPath(e.target.value)}
                                                    className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wider text-[#c2c6d6]">Failed Tries</label>
                                                <input
                                                    type="number"
                                                    value={failedTries}
                                                    onChange={(e) => setFailedTries(parseInt(e.target.value) || 2)}
                                                    className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-[#0b1326] border border-[#424754] rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded bg-[#93000a]/10 flex items-center justify-center text-[#ffb4ab]">
                                                    <span className="material-symbols-outlined">health_metrics</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#dae2fd]">Health Checks</p>
                                                    <p className="text-xs font-semibold text-[#c2c6d6]">Automated endpoint verification</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-[#ffb4ab] bg-[#93000a]/10 px-1 py-0.5 rounded uppercase">Disabled</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notifications – always visible */}
                        <div className="bg-[#171f33] rounded-xl border border-[#424754] overflow-hidden">
                            <div className="p-4 border-b border-[#424754] bg-[#222a3d] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#adc6ff]">notifications</span>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Notifications</span>
                                </div>
                            </div>
                            <div className="p-6 space-y-2">
                                {/* Discord */}
                                <div className="flex items-center justify-between p-2 hover:bg-[#0b1326] rounded transition">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-[#c2c6d6] opacity-40">forum</span>
                                        <span className="text-sm text-[#dae2fd]">Discord</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setDiscordEnabled(!discordEnabled)}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${discordEnabled ? "bg-[#adc6ff]" : "bg-[#2d3449]"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${discordEnabled ? "left-[calc(100%-20px)] bg-white" : "left-1 bg-[#424754]"
                                                    }`}
                                            ></span>
                                        </button>
                                        {discordEnabled && (
                                            <button className="material-symbols-outlined text-[#c2c6d6] hover:text-[#dae2fd]">
                                                settings
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {discordEnabled && (
                                    <div className="pl-10 pr-2 pb-2">
                                        <input
                                            type="url"
                                            value={discordWebhook}
                                            onChange={(e) => setDiscordWebhook(e.target.value)}
                                            placeholder="https://discord.com/api/webhooks/..."
                                            className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                        />
                                    </div>
                                )}

                                {/* Telegram */}
                                <div className="flex items-center justify-between p-2 hover:bg-[#0b1326] rounded transition">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-[#c2c6d6] opacity-40">send</span>
                                        <span className="text-sm text-[#dae2fd]">Telegram</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setTelegramEnabled(!telegramEnabled)}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${telegramEnabled ? "bg-[#adc6ff]" : "bg-[#2d3449]"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${telegramEnabled ? "left-[calc(100%-20px)] bg-white" : "left-1 bg-[#424754]"
                                                    }`}
                                            ></span>
                                        </button>
                                        {telegramEnabled && (
                                            <button className="material-symbols-outlined text-[#c2c6d6] hover:text-[#dae2fd]">
                                                settings
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {telegramEnabled && (
                                    <div className="pl-10 pr-2 pb-2 space-y-2">
                                        <input
                                            type="text"
                                            value={telegramBotToken}
                                            onChange={(e) => setTelegramBotToken(e.target.value)}
                                            placeholder="Bot Token"
                                            className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={telegramChatId}
                                            onChange={(e) => setTelegramChatId(e.target.value)}
                                            placeholder="Chat ID"
                                            className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                        />
                                    </div>
                                )}

                                {/* Email */}
                                <div className="flex items-center justify-between p-2 bg-[#131b2e] rounded">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-[#adc6ff]">mail</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[#dae2fd]">Email</span>
                                            {emailEnabled && <span className="text-xs font-semibold text-[#c2c6d6]">{emailAddress}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setEmailEnabled(!emailEnabled)}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${emailEnabled ? "bg-[#adc6ff]" : "bg-[#2d3449]"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${emailEnabled ? "left-[calc(100%-20px)] bg-white" : "left-1 bg-[#424754]"
                                                    }`}
                                            ></span>
                                        </button>
                                        {emailEnabled && (
                                            <button className="material-symbols-outlined text-[#adc6ff]">edit</button>
                                        )}
                                    </div>
                                </div>
                                {emailEnabled && (
                                    <div className="pl-10 pr-2 pb-2">
                                        <input
                                            type="email"
                                            value={emailAddress}
                                            onChange={(e) => setEmailAddress(e.target.value)}
                                            placeholder="dev@example.com"
                                            className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="bg-[#93000a]/5 rounded-xl border border-[#ffb4ab]/20 overflow-hidden mt-12">
                        <div className="p-4 border-b border-[#ffb4ab]/20 bg-[#93000a]/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb4ab]">warning</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#ffb4ab]">Danger Zone</span>
                        </div>
                        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-[#dae2fd]">Delete Project</p>
                                <p className="text-xs font-semibold text-[#c2c6d6] opacity-70">
                                    This will permanently delete the project. This action cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-8 py-2 bg-[#ffb4ab] text-[#690005] rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 whitespace-nowrap"
                            >
                                Delete
                            </button>
                        </div>
                    </section>

                    {/* Delete Confirmation Modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-[#171f33] border border-[#424754] rounded-xl p-6 w-full max-w-md shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-[#ffb4ab]">warning</span>
                                    <h2 className="text-lg font-semibold text-[#dae2fd]">Delete Project</h2>
                                </div>
                                <p className="text-sm text-[#c2c6d6] mb-4">
                                    This action <span className="text-[#ffb4ab] font-semibold">cannot be undone</span>. Please type <span className="font-mono text-[#adc6ff] bg-[#0b1326] px-1 rounded">{projectName}</span> to confirm.
                                </p>
                                <input
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder={projectName}
                                    className="w-full bg-[#0b1326] border border-[#424754] rounded p-2 font-mono text-sm text-[#dae2fd] mb-4 focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none"
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setConfirmName("");
                                        }}
                                        className="px-4 py-2 border border-[#424754] rounded text-xs font-semibold uppercase tracking-wider text-[#c2c6d6] hover:bg-[#222a3d] transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={confirmName !== projectName || deleting}
                                        className="px-4 py-2 bg-[#ffb4ab] text-[#690005] rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {deleting ? (
                                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        )}
                                        {deleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}