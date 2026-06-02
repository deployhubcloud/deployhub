import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/apiclient";

const PLAN_OPTIONS = {
  free: {
    name: "Free",
    price: "0",
    accent: "#2dd4bf",
    types: ["static"],
    features: ["Static sites", "DeployHub subdomain", "SSL included"],
  },
  starter: {
    name: "Starter",
    price: "9.99",
    accent: "#f59e0b",
    types: ["static", "node", "go", "python"],
    features: ["Static and services", "Custom domains", "CI/CD ready"],
  },
  pro: {
    name: "Pro",
    price: "29.99",
    accent: "#a855f7",
    types: ["static", "node", "go", "python", "java"],
    features: ["All runtimes", "Uptime monitoring", "AI diagnostics"],
  },
};

const TYPE_LABELS = {
  static: "Static",
  node: "Node.js",
  go: "Go",
  python: "Python",
  java: "Java",
};

const MONTHS = [1, 3, 6, 12];

function useRazorpay() {
  const [loaded, setLoaded] = useState(() => Boolean(window.Razorpay));
  useEffect(() => {
    if (loaded) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => (script.onload = null);
  }, [loaded]);
  return loaded;
}

function parseEnv(envText) {
  if (!envText.trim()) return undefined;
  return envText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const separator = line.indexOf("=");
      if (separator > 0) {
        acc[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      }
      return acc;
    }, {});
}

function buildPayload(form, plan, months, projectType, selectedRepo) {
  const env = parseEnv(form.envText);
  const isStatic = projectType === "static";
  const isMicroservice = isStatic ? false : form.isMicroservice;
  const payload = {
    plan,
    months,
    projectName: form.projectName.trim(),
    projectType,
    isMicroservice,
    repoUrl: form.repoUrl.trim(),
    branch: form.branch.trim(),
    rootDirectory: form.rootDirectory.trim() || ".",
    subdomain: isMicroservice ? undefined : form.subdomain.trim() || undefined,
    env: env && Object.keys(env).length ? env : undefined,
    notifications: {
      email: { enabled: form.emailNotifications, emailAddress: form.notificationEmail.trim() || undefined },
      discord: { enabled: form.discordNotifications, webhookUrl: form.discordWebhookUrl.trim() || undefined },
      telegram: { enabled: form.telegramNotifications, botToken: form.telegramBotToken.trim() || undefined, chatId: form.telegramChatId.trim() || undefined },
    },
    monitor: { enabled: form.monitorEnabled, healthPath: form.healthPath.trim() || "/health" },
    ...(isStatic
      ? { buildCommand: form.buildCommand.trim(), publishDir: form.publishDir.trim() }
      : { startCommand: form.startCommand.trim(), port: Number(form.port) }),
  };

  // If a GitHub repo was selected, attach additional metadata
  if (selectedRepo) {
    payload.repoMetadata = {
      id: selectedRepo.id,
      fullName: selectedRepo.full_name,
      private: selectedRepo.private,
      htmlUrl: selectedRepo.html_url,
      description: selectedRepo.description,
      defaultBranch: selectedRepo.default_branch,
    };
  }
  return payload;
}

export default function NewProject() {
  const { type = "static" } = useParams();
  const { user } = useAuth();
  const razorpayLoaded = useRazorpay();
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const normalizedType = type.toLowerCase();
  const selectedType = TYPE_LABELS[normalizedType] ? normalizedType : "static";
  const defaultPlan = selectedType === "static" ? "free" : selectedType === "java" ? "pro" : "starter";

  const [plan, setPlan] = useState(defaultPlan);
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [repoError, setRepoError] = useState("");
  const [created, setCreated] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [useManualRepo, setUseManualRepo] = useState(false);
  const [repoQuery, setRepoQuery] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    repoUrl: "",
    branch: "main",
    rootDirectory: ".",
    isMicroservice: false,
    subdomain: "",
    buildCommand: "npm run build",
    publishDir: "dist",
    startCommand: "npm start",
    port: "3000",
    envText: "",
    monitorEnabled: false,
    healthPath: "/health",
    emailNotifications: false,
    notificationEmail: user?.email || "",
    discordNotifications: false,
    discordWebhookUrl: "",
    telegramNotifications: false,
    telegramBotToken: "",
    telegramChatId: "",
  });

  // Fetch GitHub repos if user is connected via GitHub
  useEffect(() => {
    const fetchRepos = async () => {
      if (!user || user.provider !== 'github') return;
      setLoadingRepos(true);
      setRepoError("");
      try {
        const response = await api.get("/auth/user/repos");
        setRepos(response.data.repositories || []);
      } catch (err) {
        console.error("Failed to fetch repos", err);
        setRepoError("Could not load your GitHub repositories. You can still enter a repository URL manually.");
        setUseManualRepo(true);
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, [user]);

  const allowedTypes = PLAN_OPTIONS[plan].types;
  const isStatic = selectedType === "static";
  const microserviceEnabled = !isStatic && form.isMicroservice;
  const isPaid = plan !== "free";
  const isGitHubUser = user && user.provider === 'github';
  const filteredRepos = useMemo(() => {
    const query = repoQuery.trim().toLowerCase();
    if (!query) return repos.slice(0, 8);
    return repos
      .filter((repo) => {
        const searchable = `${repo.full_name || ""} ${repo.description || ""}`.toLowerCase();
        return searchable.includes(query);
      })
      .slice(0, 8);
  }, [repoQuery, repos]);

  // Build payload with repo metadata if a GitHub repo was selected
  const previewPayload = useMemo(
    () => buildPayload(form, plan, months, selectedType, selectedRepo),
    [form, months, plan, selectedType, selectedRepo]
  );

  useEffect(() => {
    if (isStatic && form.isMicroservice) {
      setForm((prev) => ({ ...prev, isMicroservice: false }));
    }
  }, [form.isMicroservice, isStatic]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setMicroserviceMode = (enabled) => {
    setForm((prev) => ({
      ...prev,
      isMicroservice: enabled,
      subdomain: enabled ? "" : prev.subdomain,
    }));
  };

  const selectPlan = (nextPlan) => {
    if (!PLAN_OPTIONS[nextPlan].types.includes(selectedType)) {
      setError(`${PLAN_OPTIONS[nextPlan].name} does not support ${TYPE_LABELS[selectedType]}.`);
      return;
    }
    setPlan(nextPlan);
    setMonths(1);
    setError("");
    setCreated(null);
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setField("repoUrl", repo.html_url);
    setField("branch", repo.default_branch);
    if (!form.projectName) {
      setField("projectName", repo.name);
    }
    setRepoError("");
    setUseManualRepo(false);
  };

  const retryRepoFetch = async () => {
    setLoadingRepos(true);
    setRepoError("");
    try {
      const response = await api.get("/auth/user/repos");
      setRepos(response.data.repositories || []);
      setUseManualRepo(false);
    } catch (err) {
      console.error("Failed to fetch repos", err);
      setRepoError("Could not load your GitHub repositories. You can still enter a repository URL manually.");
      setUseManualRepo(true);
    } finally {
      setLoadingRepos(false);
    }
  };

  const validate = () => {
    if (!form.projectName.trim()) return "Project name is required.";
    if (!form.repoUrl.trim()) return "Repository URL is required.";
    if (!form.branch.trim()) return "Branch is required.";
    if (!allowedTypes.includes(selectedType)) return `${PLAN_OPTIONS[plan].name} does not support ${TYPE_LABELS[selectedType]}.`;
    if (isStatic && !form.buildCommand.trim()) return "Build command is required for static projects.";
    if (isStatic && !form.publishDir.trim()) return "Publish directory is required for static projects.";
    if (!isStatic && !form.startCommand.trim()) return "Start command is required for services.";
    if (!isStatic && (!Number.isInteger(Number(form.port)) || Number(form.port) < 1 || Number(form.port) > 65535))
      return "Port must be between 1 and 65535.";
    if (!microserviceEnabled && !form.subdomain.trim()) return "Subdomain is required when microservice mode is off.";
    if (form.subdomain.trim() && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.subdomain.trim()))
      return "Subdomain can only contain lowercase letters, numbers, and hyphens.";
    if (form.emailNotifications && !form.notificationEmail.trim()) return "Notification email is required when email alerts are enabled.";
    if (form.discordNotifications && !form.discordWebhookUrl.trim()) return "Discord webhook URL is required when Discord alerts are enabled.";
    if (form.telegramNotifications && (!form.telegramBotToken.trim() || !form.telegramChatId.trim()))
      return "Telegram bot token and chat ID are required when Telegram alerts are enabled.";
    if (isPaid && !razorpayKey) return "Razorpay key is missing in frontend env.";
    return "";
  };

  const createFreeProject = async () => {
    const { data } = await api.post("/project/projects", { ...previewPayload, plan: "free" });
    setCreated(data);
  };

  const createPaidProject = async () => {
    if (!razorpayLoaded) throw new Error("Payment gateway is still loading.");
    const { data: order } = await api.post("/project/payment/init", previewPayload);
    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "DeployHub",
        description: `${PLAN_OPTIONS[plan].name} project deployment`,
        order_id: order.id || order.orderId,
        prefill: { name: user?.fullName || user?.fullname || "", email: user?.email || "" },
        handler: async (response) => {
          try {
            const { data } = await api.post("/project/payment/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setCreated(data);
            resolve(data);
          } catch (err) {
            reject(err);
          }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
      });
      checkout.open();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCreated(null);
    const validationError = validate();
    if (validationError) return setError(validationError);
    setSubmitting(true);
    try {
      if (isPaid) await createPaidProject();
      else await createFreeProject();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Project creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!TYPE_LABELS[normalizedType]) return <Navigate to="/projects/new/static" replace />;

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all";
  const repoActionClass = "text-xs font-medium text-violet-300 hover:text-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f1c] to-[#05070f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition">
              ← Back to projects
            </Link>
            <h1 className="mt-3 text-3xl font-bold bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">Deploy new project</h1>
            <p className="mt-1 text-gray-400">Connect your repository and launch in seconds</p>
          </div>
          {created && (
            <div className="rounded-2xl bg-emerald-500/20 backdrop-blur-sm px-5 py-3 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="text-lg">✓</span> Project queued — ID: {created.projectId || created.project?._id}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left column: Plans + Form */}
          <div className="space-y-8">
            {/* Plan cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Object.entries(PLAN_OPTIONS).map(([key, item]) => {
                const selected = plan === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => selectPlan(key)}
                    className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${selected
                      ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{item.name}</h3>
                        <p className="mt-1 text-2xl font-black">
                          ₹{item.price}
                          <span className="text-sm font-normal text-gray-400">/mo</span>
                        </p>
                      </div>
                      {selected && (
                        <div className="rounded-full bg-violet-500 p-1">
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.types.map((t) => (
                        <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{TYPE_LABELS[t]}</span>
                      ))}
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-300">
                      {item.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5">• {f}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Main form card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Project name</label>
                  <input type="text" value={form.projectName} onChange={(e) => setField("projectName", e.target.value)} className={inputClass} placeholder="my-app" />
                </div>

                {/* Repository selection – with loading, error, and manual toggle */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Repository</label>
                  {isGitHubUser && !useManualRepo ? (
                    <div className="space-y-2">
                      {loadingRepos ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
                            <span className="text-sm text-gray-300">Fetching your repositories...</span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {[0, 1, 2, 3].map((item) => (
                              <div key={item} className="h-14 animate-pulse rounded-lg bg-white/10" />
                            ))}
                          </div>
                        </div>
                      ) : repoError ? (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                            {repoError}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={retryRepoFetch} className={repoActionClass}>
                              Retry
                            </button>
                            <button type="button" onClick={() => setUseManualRepo(true)} className={repoActionClass}>
                              Enter URL manually
                            </button>
                          </div>
                        </div>
                      ) : repos.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-gray-300">No repositories found.</p>
                          <button type="button" onClick={() => setUseManualRepo(true)} className={`${repoActionClass} mt-2`}>
                            Enter URL manually
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="search"
                              value={repoQuery}
                              onChange={(e) => setRepoQuery(e.target.value)}
                              className={inputClass}
                              placeholder="Search repositories"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRepo(null);
                                setUseManualRepo(true);
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-white/10"
                            >
                              Manual URL
                            </button>
                          </div>

                          {selectedRepo && (
                            <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                              Selected: <span className="font-medium">{selectedRepo.full_name}</span>
                            </div>
                          )}

                          <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                            {filteredRepos.map((repo) => {
                              const selected = selectedRepo?.id === repo.id;
                              return (
                                <button
                                  key={repo.id}
                                  type="button"
                                  onClick={() => handleRepoSelect(repo)}
                                  className={`min-w-0 rounded-lg border p-3 text-left transition ${
                                    selected
                                      ? "border-violet-400 bg-violet-500/15"
                                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-white">{repo.full_name}</span>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${repo.private ? "bg-amber-400/15 text-amber-200" : "bg-cyan-400/15 text-cyan-200"}`}>
                                      {repo.private ? "Private" : "Public"}
                                    </span>
                                  </div>
                                  <p className="mt-1 truncate text-xs text-gray-400">
                                    {repo.description || `Default branch: ${repo.default_branch}`}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                          {filteredRepos.length === 0 && (
                            <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-400">No repository matches your search.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {repoError && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                          {repoError}
                        </div>
                      )}
                      <input
                        type="url"
                        value={form.repoUrl}
                        onChange={(e) => {
                          setSelectedRepo(null);
                          setField("repoUrl", e.target.value);
                        }}
                        className={inputClass}
                        placeholder="https://github.com/user/repo"
                      />
                      {isGitHubUser && useManualRepo && (
                        <button
                          type="button"
                          onClick={() => {
                            setRepoError("");
                            setUseManualRepo(false);
                          }}
                          className={repoActionClass}
                        >
                          Back to repository list
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Branch</label>
                  <input type="text" value={form.branch} onChange={(e) => setField("branch", e.target.value)} className={inputClass} placeholder="main" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Root directory</label>
                  <input type="text" value={form.rootDirectory} onChange={(e) => setField("rootDirectory", e.target.value)} className={inputClass} placeholder="." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Subdomain</label>
                  <input type="text" value={form.subdomain} onChange={(e) => setField("subdomain", e.target.value.toLowerCase())} disabled={microserviceEnabled} required={!microserviceEnabled} className={inputClass} placeholder="my-app" />
                </div>
                {!isStatic && (
                  <div className="flex items-end">
                    <button type="button" onClick={() => setMicroserviceMode(!microserviceEnabled)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition ${microserviceEnabled ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5"}`}>
                      <span>Microservice mode</span>
                      <div className={`h-5 w-9 rounded-full transition ${microserviceEnabled ? "bg-purple-500" : "bg-white/30"}`}>
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${microserviceEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Build / start commands – unchanged */}
              <div className="grid gap-5 sm:grid-cols-2">
                {isStatic ? (
                  <>
                    <div><label className="block text-sm font-medium text-gray-300">Build command</label><input type="text" value={form.buildCommand} onChange={(e) => setField("buildCommand", e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Publish directory</label><input type="text" value={form.publishDir} onChange={(e) => setField("publishDir", e.target.value)} className={inputClass} /></div>
                  </>
                ) : (
                  <>
                    <div><label className="block text-sm font-medium text-gray-300">Start command</label><input type="text" value={form.startCommand} onChange={(e) => setField("startCommand", e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Port</label><input type="number" value={form.port} onChange={(e) => setField("port", e.target.value)} className={inputClass} /></div>
                  </>
                )}
              </div>

              {/* Environment variables */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Environment variables (KEY=value per line)</label>
                <textarea rows={3} value={form.envText} onChange={(e) => setField("envText", e.target.value)} className={`${inputClass} font-mono`} placeholder="NODE_ENV=production&#10;API_KEY=xxx" />
              </div>

              {/* Monitoring (Pro only) */}
              {plan === "pro" && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <button type="button" onClick={() => setField("monitorEnabled", !form.monitorEnabled)} className="flex w-full items-center justify-between">
                    <div><h3 className="font-semibold">Uptime monitoring</h3><p className="text-sm text-gray-400">Get alerts on downtime</p></div>
                    <div className={`h-5 w-9 rounded-full transition ${form.monitorEnabled ? "bg-violet-500" : "bg-white/30"}`}>
                      <div className={`h-5 w-5 rounded-full bg-white transition-transform ${form.monitorEnabled ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </button>
                  {form.monitorEnabled && (
                    <div className="mt-3"><label className="text-sm text-gray-300">Health path</label><input type="text" value={form.healthPath} onChange={(e) => setField("healthPath", e.target.value)} className={inputClass} /></div>
                  )}
                </div>
              )}

              {/* Notifications */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                <h3 className="font-semibold">Alert channels</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><button type="button" onClick={() => setField("emailNotifications", !form.emailNotifications)} className="flex w-full justify-between rounded-lg bg-white/5 px-3 py-2">Email <div className={`h-5 w-9 rounded-full transition ${form.emailNotifications ? "bg-violet-500" : "bg-white/30"}`}><div className={`h-5 w-5 rounded-full bg-white transition-transform ${form.emailNotifications ? "translate-x-4" : "translate-x-0"}`} /></div></button>{form.emailNotifications && <input type="email" value={form.notificationEmail} onChange={(e) => setField("notificationEmail", e.target.value)} className={`${inputClass} mt-2`} placeholder="you@example.com" />}</div>
                  <div><button type="button" onClick={() => setField("discordNotifications", !form.discordNotifications)} className="flex w-full justify-between rounded-lg bg-white/5 px-3 py-2">Discord <div className={`h-5 w-9 rounded-full transition ${form.discordNotifications ? "bg-violet-500" : "bg-white/30"}`}><div className={`h-5 w-5 rounded-full bg-white transition-transform ${form.discordNotifications ? "translate-x-4" : "translate-x-0"}`} /></div></button>{form.discordNotifications && <input type="url" value={form.discordWebhookUrl} onChange={(e) => setField("discordWebhookUrl", e.target.value)} className={`${inputClass} mt-2`} placeholder="https://discord.com/api/webhooks/..." />}</div>
                  <div><button type="button" onClick={() => setField("telegramNotifications", !form.telegramNotifications)} className="flex w-full justify-between rounded-lg bg-white/5 px-3 py-2">Telegram <div className={`h-5 w-9 rounded-full transition ${form.telegramNotifications ? "bg-violet-500" : "bg-white/30"}`}><div className={`h-5 w-5 rounded-full bg-white transition-transform ${form.telegramNotifications ? "translate-x-4" : "translate-x-0"}`} /></div></button>{form.telegramNotifications && <div className="space-y-2 mt-2"><input type="text" value={form.telegramBotToken} onChange={(e) => setField("telegramBotToken", e.target.value)} className={inputClass} placeholder="Bot token" /><input type="text" value={form.telegramChatId} onChange={(e) => setField("telegramChatId", e.target.value)} className={inputClass} placeholder="Chat ID" /></div>}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Summary + Action */}
          <div className="space-y-6">
            <div className="sticky top-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold">Order summary</h2>
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between"><span className="text-gray-400">Plan</span><span className="font-medium">{PLAN_OPTIONS[plan].name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Type</span><span>{TYPE_LABELS[selectedType]}</span></div>
                {isPaid && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration</span>
                    <div className="flex gap-2">
                      {MONTHS.map((m) => (
                        <button key={m} type="button" onClick={() => setMonths(m)} className={`rounded-md px-2 py-1 text-xs font-medium transition ${months === m ? "bg-violet-500 text-white" : "bg-white/10 hover:bg-white/20"}`}>{m}m</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-violet-400">₹{isPaid ? parseInt(PLAN_OPTIONS[plan].price) * months : 0}{isPaid && <span className="text-sm font-normal text-gray-400"> / {months} mo</span>}</span>
                </div>
              </div>
              {error && <div className="mt-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-300">{error}</div>}
              <button type="submit" disabled={submitting || (isPaid && !razorpayLoaded)} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-bold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.02] disabled:opacity-50">
                {submitting ? (isPaid ? "Processing payment..." : "Creating project...") : (isPaid ? "Pay & Deploy" : "Deploy for Free")}
              </button>
              {isPaid && !razorpayLoaded && <p className="mt-2 text-center text-xs text-gray-500">Loading payment gateway...</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
