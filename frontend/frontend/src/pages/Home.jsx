import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import { useLaunchModal } from '../lib/launch-modal.jsx'

const FEATURES = [
  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>, title: "GitHub to Live", desc: "Connect a repo and ship on push. CI/CD pipelines, preview environments, and zero config." },
  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" /><path d="M10 21.9V14L2.1 9.1" /><path d="m10 14 11.9-6.9" /><path d="M14 19.8v-8.1" /><path d="M18 17.5V9.4" /></svg>, title: "Docker isolation", desc: "Every service runs in its own container with strict resource limits and clean networking." },
  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" /></svg>, title: "Private microservice mesh", desc: "Services talk over a private internal network using secret container IDs. Nothing is exposed unless you say so." },
  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, title: "Auto SSL & domains", desc: "Every project gets a subdomain. Bring your own domain on paid plans. SSL via Let's Encrypt, renewed automatically." },
  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>, title: "Uptime & auto-heal", desc: "Continuous health checks, automatic restarts on crashes, and root cause hints on failure." },
  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>, title: "AI diagnostics", desc: "Failed build? Bad log? Get a plain-English explanation and a fix suggestion in one click." },
];

export default function Home() {
  const { openLaunch } = useLaunchModal();
  useReveal();
  const [count, setCount] = useState(0);
  const glowRef = useRef(null);

  useEffect(() => {
    const target = 1247;
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    const increment = target / steps;
    let cur = 0, step = 0;
    const timer = setInterval(() => {
      step++;
      cur = Math.round(increment * step);
      if (step >= steps) { setCount(target); clearInterval(timer); } else { setCount(cur); }
    }, stepTime);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const move = (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`); };
    el.addEventListener('mousemove', move);
    return () => el.removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="bg-page text-primary">
      {/* Hero Section */}
      <section ref={glowRef} className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="absolute inset-0 -z-10 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-6xl reveal">
              Deploy from GitHub. <span className="grad-text">Live in seconds.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-gray-600 dark:text-gray-400 sm:text-lg reveal">
              Ship static sites and backend services with Docker isolation, automatic SSL, real-time logs, uptime monitoring, and AI diagnostics — out of the box.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 reveal">
              <button onClick={openLaunch} className="inline-flex items-center gap-2 rounded-md bg-cyan px-5 py-2.5 text-sm font-medium text-black shadow-[0_0_40px_-10px_#00e5ff] transition-transform hover:scale-[1.02]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                Start deploying
              </button>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-md border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#111827]/60 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white hover:border-cyan/40">View pricing <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></Link>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mx-auto mt-16 max-w-5xl reveal">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-cyan/20 via-violet/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#111827]/80 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#080c10]/50 px-4 py-2.5">
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500/70" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" /><span className="h-2.5 w-2.5 rounded-full bg-green-500/80" /></div>
                  <div className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#080c10] px-2.5 py-1 text-xs text-gray-500 dark:text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>api-gateway.deployhub.app</div>
                  <div className="w-12" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  <aside className="hidden border-r border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-[#080c10]/40 p-4 lg:col-span-2 lg:block">
                    <p className="px-1 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">Projects</p>
                    <ul className="mt-3 space-y-1.5">
                      {[{ name: "api-gateway", branch: "main", status: "success" }, { name: "marketing-site", branch: "main", status: "success" }, { name: "worker-jobs", branch: "feat/queue", status: "warning" }, { name: "auth-service", branch: "main", status: "success" }].map(p => (
                        <li key={p.name} className="flex items-center justify-between rounded-md border border-transparent px-2.5 py-2 text-sm hover:border-gray-200 dark:hover:border-white/10 hover:bg-white dark:hover:bg-[#111827]">
                          <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${p.status === "warning" ? "animate-pulse bg-yellow-500" : "bg-green-500"}`} /><span className="text-gray-900 dark:text-white">{p.name}</span></div>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M15 6a9 9 0 0 0-9 9V3" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /></svg>{p.branch}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                  <div className="lg:col-span-3">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-[#080c10]/30 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 animate-spin text-cyan"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg><span className="font-medium text-gray-900 dark:text-white">api-gateway</span><span>· build #284</span></div>
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500 ring-1 ring-green-500/30">deploying</span>
                    </div>
                    <pre className="overflow-hidden p-4 font-mono text-[12px] leading-relaxed text-gray-600 dark:text-gray-500">
                      {`> docker build -t api-gateway:284 .`}<br /><span className="text-green-500">[+] pulling node:20-alpine ........ ok</span><br /><span className="text-green-500">[+] installing dependencies ...... 142 pkg</span><br /><span className="text-green-500">[+] compiling typescript ......... ok</span><br /><span className="text-cyan">[*] pushing image to registry .... 14.2 MB</span><br /><span className="text-cyan">[*] provisioning container ....... a8f31c</span><br /><span className="text-gray-900 dark:text-white">[*] attaching nginx reverse proxy</span><br /><span className="text-gray-900 dark:text-white">[*] issuing tls cert via lets-encrypt</span><br /><span className="text-green-500 flex items-center gap-1">[ok] live at https://api-gateway.deployhub.app</span>
                    </pre>
                    <div className="grid grid-cols-3 gap-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-[#080c10]/30 p-4">
                      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#111827]/60 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Uptime</p><p className="mt-1 text-base font-semibold text-green-500">99.98%</p></div>
                      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#111827]/60 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">p95 latency</p><p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">142 ms</p></div>
                      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#111827]/60 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Requests/min</p><p className="mt-1 text-base font-semibold text-violet">1.2k</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stack Logos */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10"><p className="text-center text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">Built for the stack you already use</p><div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-500/80">{["Node.js", "Go", "Python", "Java", "Docker", "Nginx", "GitHub", "Let's Encrypt"].map(tech => <span key={tech} className="font-medium">{tech}</span>)}</div></div>

      {/* Features Grid */}
      <section className="relative py-24"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl mx-auto text-center"><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">Platform</span><h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Everything you need to ship and operate.</h2><p className="mt-3 text-pretty text-base text-gray-600 dark:text-gray-400 sm:text-lg">A focused toolkit for developers — no dashboards full of features you'll never use.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map((feature, i) => (<div key={feature.title} className="feat-card group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 transition-colors hover:border-cyan/40"><div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/10 text-cyan ring-1 ring-cyan/20">{feature.icon}</div><h3 className="text-base font-semibold text-gray-900 dark:text-white">{feature.title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-500">{feature.desc}</p><div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "radial-gradient(400px circle at var(--x,50%) var(--y,50%), color-mix(in oklab, #00e5ff 12%, transparent), transparent 40%)" }} /></div>))}</div></div></section>

      {/* How It Works */}
      <section className="relative border-y border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-[#111827]/30 py-24"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl mx-auto text-center"><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">How it works</span><h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Five steps from commit to production.</h2><p className="mt-3 text-pretty text-base text-gray-600 dark:text-gray-400 sm:text-lg">The pipeline is opinionated where it should be, configurable where it matters.</p></div><ol className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-5">{[{ icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 6a9 9 0 0 0-9 9V3" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /></svg>, title: "Connect repository", desc: "OAuth into GitHub and pick a repo. We detect the runtime automatically." }, { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 19h8" /><path d="m4 17 6-6-6-6" /></svg>, title: "Configure runtime", desc: "Node.js, Go, Python, or Java. Set env vars and start command." }, { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>, title: "Build container", desc: "We build an isolated Docker image and push it to the internal registry." }, { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>, title: "Go live with SSL", desc: "Nginx routes traffic to your service with a fresh TLS cert." }, { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>, title: "Monitor & auto-heal", desc: "Uptime checks, alerts, and automatic restarts keep you online." }].map((step, i) => (<div key={step.title} className="reveal relative h-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-5"><div className="flex items-center justify-between"><span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan/10 text-cyan ring-1 ring-cyan/20">{step.icon}</span><span className="text-xs font-mono text-gray-500">0{i + 1}</span></div><h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{step.title}</h3><p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-500">{step.desc}</p></div>))}</ol></div></section>

      {/* Private Networking Section */}
      <section className="py-24"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 grid items-center gap-12 lg:grid-cols-2"><div className="reveal"><span className="inline-flex items-center gap-1.5 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs font-medium text-violet">Internal networking</span><h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Private mesh for your microservices.</h2><p className="mt-3 text-gray-600 dark:text-gray-400">Services discover each other via secret container IDs over a private network. The public internet sees only what you explicitly publish — everything else stays inside.</p><ul className="mt-6 space-y-3 text-sm"><li className="flex items-start gap-2.5"><span className="mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-cyan"><rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" /></svg></span><span>Zero-config service discovery on private DNS</span></li><li className="flex items-start gap-2.5"><span className="mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-cyan"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg></span><span>Outbound-only by default; opt-in public exposure</span></li><li className="flex items-start gap-2.5"><span className="mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-cyan"><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></svg></span><span>Alerts via Email, Discord, and Telegram</span></li></ul></div><div className="reveal"><div className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6"><div className="mb-4 flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">Internal network</p><span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500 ring-1 ring-green-500/30">5 services healthy</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ name: "api-gateway", id: "a8f31c", exposed: true }, { name: "auth-service", id: "b2c4d9" }, { name: "worker-jobs", id: "f1e8a2" }, { name: "postgres", id: "c7d3b5" }, { name: "redis-cache", id: "e9a4f7" }].map(svc => (<div key={svc.name} className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-[#080c10]/60 p-3 transition-colors hover:border-cyan/30"><div className="flex items-center justify-between"><span className="h-2 w-2 rounded-full bg-green-500" />{svc.exposed ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-cyan"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-gray-600"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}</div><p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{svc.name}</p><p className="font-mono text-[10px] text-gray-500">id: {svc.id}</p></div>))}</div><div className="mt-4 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-[#080c10]/30 p-3 font-mono text-[11px] text-gray-500"><span className="text-green-500">auth-service</span> → <span className="text-cyan">postgres.internal:5432</span> <span className="text-green-500">200 OK</span></div></div></div></div></section>

      {/* Final CTA */}
      <section className="pb-24"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-10 text-center"><div className="absolute inset-0 -z-10 bg-hero-glow opacity-60" /><h2 className="text-balance text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Push a commit. Watch it go live.</h2><p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">Start free. Upgrade when you need backend runtimes, custom domains, or AI diagnostics.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><a href="#" className="inline-flex items-center gap-2 rounded-md bg-cyan px-5 py-2.5 text-sm font-medium text-black"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>Connect GitHub</a><Link to="/pricing" className="inline-flex items-center gap-2 rounded-md border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#080c10]/60 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white">See plans</Link></div></div></div></section>
    </div>
  );
}