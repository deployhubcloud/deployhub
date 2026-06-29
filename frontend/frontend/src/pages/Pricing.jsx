import { useState } from "react";
import useReveal from "../hooks/useReveal";
import PlanCard from "../components/PlanCard";
import FaqItem from "../components/FaqItem";

const PLANS = [
  { name: "Free", desc: "Static sites with subdomain and SSL.", monthly: 0, annual: 0, features: [
    { label: "Static site hosting", ok: true }, { label: "DeployHub subdomain", ok: true }, { label: "Automatic SSL (Let's Encrypt)", ok: true }, { label: "Email, Discord, Telegram alerts", ok: true }, { label: "Custom domain", ok: false }, { label: "GitHub CI/CD", ok: false }, { label: "Uptime monitoring", ok: false }, { label: "AI diagnostics", ok: false }
  ], cta: "Start free", ctaStyle: "outline", highlight: false, badge: null },
  { name: "Starter", desc: "Backend runtimes and custom domains.", monthly: 1499, annual: 17988, features: [
    { label: "Static, Node.js, Go, Python", ok: true }, { label: "Subdomain + custom domain", ok: true }, { label: "Automatic SSL", ok: true }, { label: "GitHub CI/CD auto-deploy", ok: true }, { label: "256 MB RAM, 0.5 CPU, 5 GB storage", ok: true }, { label: "Email, Discord, Telegram alerts", ok: true }, { label: "Uptime monitoring", ok: false }, { label: "AI diagnostics", ok: false }
  ], cta: "Choose Starter", ctaStyle: "solid", highlight: false, badge: null },
  { name: "Pro", desc: "Production stack with monitoring and AI.", monthly: 2499, annual: 29988, features: [
    { label: "Static, Node.js, Go, Python, Java", ok: true }, { label: "Subdomain + custom domain", ok: true }, { label: "Automatic SSL", ok: true }, { label: "GitHub CI/CD auto-deploy", ok: true }, { label: "512 MB RAM, 1 CPU, 10 GB storage", ok: true }, { label: "Uptime monitoring + auto-restart", ok: true }, { label: "AI diagnostics for builds & logs", ok: true }, { label: "Email, Discord, Telegram alerts", ok: true }
  ], cta: "Choose Pro", ctaStyle: "solid", highlight: true, badge: "Most popular" }
];

const FAQS = [
  { q: "How does per-project pricing work?", a: "Each project on Starter or Pro is billed separately at its plan rate. Static sites on Free do not count toward usage." },
  { q: "Can I bring my own domain?", a: "Yes, on Starter and Pro. We issue and renew TLS certs automatically via Let's Encrypt." },
  { q: "What happens if my app crashes?", a: "Pro projects are health-checked and auto-restarted. You also get a root-cause hint and a Discord/Email/Telegram alert." },
  { q: "What is AI diagnostics?", a: "When a build or runtime fails, AI diagnostics reads the logs and explains the failure in plain English with a suggested fix." },
];

export default function Pricing() {
  useReveal();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const annual = billingCycle === "yearly";

  return (
    <div className="min-h-screen pt-16 bg-page text-primary">
      {/* Hero */}
      <section className="relative isolate overflow-hidden pb-10 pt-20">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              Pricing
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">
              Per-project pricing. No surprises.
            </h2>
            <p className="mt-3 text-pretty text-base text-neutral-400 sm:text-lg">
              Start free. Pay per project when you need backend runtimes, custom domains, or monitoring.
            </p>
          </div>
        </div>
      </section>

      {/* Plans & toggle */}
      <section className="pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-3 mb-10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                  : "bg-[#1a1a1f] text-neutral-300 hover:bg-[#222]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                  : "bg-[#1a1a1f] text-neutral-300 hover:bg-[#222]"
              }`}
            >
              Yearly
              
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.name} plan={plan} annual={annual} delay={i * 100} />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-500">
            Pricing is per project, billed monthly. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t border-white/[0.06] bg-[#111114]/30 py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">
              Compare plans
            </h2>
          </div>
          <div className="mt-10 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111114]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-4 font-medium">Feature</th>
                  <th className="px-5 py-4 font-medium">Free</th>
                  <th className="px-5 py-4 font-medium">Starter</th>
                  <th className="px-5 py-4 font-medium text-amber-400">Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Static site hosting", true, true, true],
                  ["Backend runtimes", "—", "Node, Go, Python", "Node, Go, Python, Java"],
                  ["DeployHub subdomain", true, true, true],
                  ["Custom domain", false, true, true],
                  ["Automatic SSL", true, true, true],
                  ["GitHub CI/CD", false, true, true],
                  ["Container resources", "—", "256 MB / 0.5 CPU / 5 GB", "512 MB / 1 CPU / 10 GB"],
                  ["Uptime monitoring", false, false, true],
                  ["AI diagnostics", false, false, true],
                  ["Email / Discord / Telegram alerts", true, true, true],
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-5 py-3.5 text-white">{row[0]}</td>
                    {[1, 2, 3].map(col => (
                      <td key={col} className="px-5 py-3.5">
                        {typeof row[col] === "boolean" ? (
                          row[col] ? (
                            <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                          ) : (
                            <svg className="h-4 w-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          )
                        ) : (
                          <span className="text-neutral-400">{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">
              Frequently asked
            </h2>
          </div>
          <div className="mt-10 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-[#111114]">
            {FAQS.map((faq, i) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}