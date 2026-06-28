import { useState, useEffect } from "react";
import useReveal from "../hooks/useReveal";

const TERMINAL_LINES = [
  { prompt: true, text: "deployhub connect github Rahulkumar6777/my-app", color: "text-white" },
  { prompt: false, text: "  ✔ GitHub repo linked", color: "text-emerald-400" },
  { prompt: false, text: "  Cloning repository...", color: "text-neutral-500" },
  { prompt: false, text: "  ✔ Node.js 20 detected", color: "text-emerald-400" },
  { prompt: false, text: "  Building Docker image...", color: "text-neutral-500" },
  { prompt: false, text: "  ✔ Image pushed to registry", color: "text-emerald-400" },
  { prompt: false, text: "  Starting container...", color: "text-neutral-500" },
  { prompt: false, text: "  ✔ SSL provisioned automatically", color: "text-emerald-400" },
  { prompt: false, text: "  ✔ App is live! 🚀", color: "text-emerald-400" },
  { prompt: false, text: "", color: "" },
  { prompt: true, text: "echo $LIVE_URL", color: "text-white" },
  { prompt: false, text: "  https://my-app.deployhub.online", color: "text-amber-400" },
];

export default function About() {
  useReveal();
  const [typedLines, setTypedLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < TERMINAL_LINES.length) {
        setTypedLines(prev => [...prev, TERMINAL_LINES[i]]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 280);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="min-h-screen pt-16 overflow-x-hidden bg-page text-primary">
      {/* Hero */}
      <section className="relative isolate overflow-hidden pb-10 pt-20">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              About
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">
              Serious infrastructure, made simple.
            </h2>
            <p className="mt-3 text-pretty text-base text-neutral-400 sm:text-lg">
              DeployHub is a developer-first hosting platform. We hide the boring parts — orchestration, certs, networking — without taking control away from you.
            </p>
          </div>
        </div>
      </section>

      {/* Terminal animation */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-white/[0.06] bg-[#111114] overflow-hidden shadow-xl">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0b]">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-auto text-[10px] text-neutral-500 font-mono">deployhub • connect</span>
              </div>
              <div className="p-5 font-mono text-sm leading-[1.9] min-h-[280px]">
                {typedLines.map((line, i) =>
                  line ? ( // ⬅️ null check to avoid crash
                    <div key={i} className={line.color}>{line.text}</div>
                  ) : null
                )}
                {typedLines.length < TERMINAL_LINES.length && (
                  <div className="text-amber-400">
                    <span
                      className="inline-block w-2 h-4 bg-amber-400 align-middle"
                      style={{ opacity: cursorVisible ? 1 : 0 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture stack */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">
              How the platform fits together
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {[
              { layer: "Layer 01", title: "GitHub", desc: "Source of truth. Push to deploy.", border: "border-white/[0.06]" },
              { layer: "Layer 02", title: "Builder", desc: "Detects runtime, builds Docker image, pushes to registry.", border: "border-amber-500/30" },
              { layer: "Layer 03", title: "Container runtime", desc: "Isolated workloads with strict CPU/RAM/storage limits.", border: "border-amber-500/30" },
              { layer: "Layer 04", title: "Nginx reverse proxy", desc: "Routes traffic, serves static files, terminates TLS.", border: "border-amber-500/20" },
              { layer: "Layer 05", title: "Public internet", desc: "Your users — over HTTPS, with custom or DeployHub domains.", border: "border-white/[0.06]" },
            ].map((item, i) => (
              <div key={item.layer} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={`rounded-xl border bg-[#111114] p-5 ${item.border}`}>
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">{item.layer}</p>
                  <h3 className="mt-1 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-neutral-400">{item.desc}</p>
                </div>
                {i < 4 && (
                  <div className="my-1 flex justify-center text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 rotate-90">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-white/[0.06] bg-[#111114]/30 py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">What powers it</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"/><path d="M10 21.9V14L2.1 9.1"/><path d="m10 14 11.9-6.9"/><path d="M14 19.8v-8.1"/><path d="M18 17.5V9.4"/></svg>, title:"Docker isolation", desc:"Every project runs in its own container. Crash one, the others stay up. Resource limits are enforced per project." },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>, title:"Private networking", desc:"Services discover each other on a private mesh using secret container IDs. The public internet only sees what you publish." },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>, title:"Nginx + Let's Encrypt", desc:"Nginx routes traffic and serves static assets. SSL certificates are issued, renewed, and revoked automatically." },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>, title:"Monitoring", desc:"Continuous health checks, uptime tracking, and automatic restarts on failure — with alerts you can actually act on." },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>, title:"AI diagnostics", desc:"Failed builds and noisy logs get turned into a short, human explanation with a suggested fix." }
            ].map((item, i) => (
              <div key={item.title} className="reveal h-full rounded-xl border border-white/[0.06] bg-[#111114] p-6">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-20">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white">Built for engineers who ship.</h2>
          <p className="mt-3 text-neutral-400">DeployHub is designed to feel honest. We won't promise unlimited anything. We will give you a platform that gets out of the way and stays out of the way.</p>
        </div>
      </section>
    </div>
  );
}