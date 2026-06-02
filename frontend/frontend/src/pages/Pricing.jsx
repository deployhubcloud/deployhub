import { useState } from 'react'
import useReveal from '../components/useReveal'
import PlanCard from '../components/PlanCard'
import FaqItem from '../components/FaqItem'

// ------------------------------------------------------------------
// 1. Define the raw plan data based on the provided JS objects
// ------------------------------------------------------------------
const FREE_DATA = {
  name: 'Free',
  desc: 'Perfect for side projects and learning. No card needed.',
  monthly: 0,
  features: {
    frontend: true,        // static hosting
    backendRuntimes: [],   // none
    subdomain: true,
    customDomain: false,
    ssl: true,
    alerts: true,
    githubCiCd: false,
    aiDiagnostics: false,
    uptimeMonitoring: false,
    resources: null,
  },
  cta: 'Deploy for Free',
  ctaStyle: 'outline',
  highlight: false,
  badge: null,
}

const STARTER_DATA = {
  name: 'Starter',
  desc: 'For production apps that need backend runtimes & a custom domain.',
  monthly: 9.99,
  features: {
    frontend: true,
    backendRuntimes: ['Node.js', 'Go', 'Python'],
    subdomain: true,
    customDomain: true,
    ssl: true,
    alerts: true,
    githubCiCd: true,
    aiDiagnostics: false,
    uptimeMonitoring: false,
    resources: {
      ram: '256 MB',
      cpu: '0.5 vCPU',
      storage: '5 GB',
    },
  },
  cta: 'Start with Starter',
  ctaStyle: 'solid',
  highlight: false,
  badge: null,
}

const PRO_DATA = {
  name: 'Pro',
  desc: 'For high-traffic projects that need maximum power and monitoring.',
  monthly: 29.99,
  features: {
    frontend: true,
    backendRuntimes: ['Node.js', 'Go', 'Python', 'Java'],
    subdomain: true,
    customDomain: true,
    ssl: true,
    alerts: true,
    githubCiCd: true,
    aiDiagnostics: true,
    uptimeMonitoring: true,
    resources: {
      ram: '512 MB',
      cpu: '1 vCPU',
      storage: '10 GB',
    },
  },
  cta: 'Get Pro',
  ctaStyle: 'solid',
  highlight: true,
  badge: 'Most Popular',
}

// Helper to build feature array for PlanCard (label + ok)
const buildFeaturesArray = (planData) => {
  const f = planData.features
  const features = []

  // Frontend hosting (static)
  if (f.frontend) {
    features.push({ label: 'Static site hosting', ok: true })
  }

  // Backend runtimes
  if (f.backendRuntimes.length === 0) {
    features.push({ label: 'Backend runtimes: none', ok: false })
  } else {
    features.push({ label: `Backend runtimes: ${f.backendRuntimes.join(', ')}`, ok: true })
  }

  // Domain & SSL
  features.push({ label: 'Free SSL / HTTPS', ok: f.ssl })
  features.push({ label: 'deployhub.online subdomain', ok: f.subdomain })
  features.push({ label: 'Custom domain', ok: f.customDomain })

  // Resources (only if defined)
  if (f.resources) {
    features.push({ label: `RAM: ${f.resources.ram}`, ok: true })
    features.push({ label: `CPU: ${f.resources.cpu}`, ok: true })
    features.push({ label: `Storage: ${f.resources.storage}`, ok: true })
  } else {
    features.push({ label: 'Shared resources (fair use)', ok: true })
  }

  // Alerts
  features.push({ label: 'Alerts (Email, Discord, Telegram)', ok: f.alerts })

  // CI/CD & advanced features
  features.push({ label: 'GitHub CI/CD', ok: f.githubCiCd })
  features.push({ label: 'AI Diagnostics', ok: f.aiDiagnostics })
  features.push({ label: 'Uptime monitoring', ok: f.uptimeMonitoring })

  return features
}

// Build the full plan objects
const RAW_PLANS = [
  { ...FREE_DATA, featuresList: buildFeaturesArray(FREE_DATA) },
  { ...STARTER_DATA, featuresList: buildFeaturesArray(STARTER_DATA) },
  { ...PRO_DATA, featuresList: buildFeaturesArray(PRO_DATA) },
]

// Helper for annual pricing (20% discount)
const getPlanWithBilling = (rawPlan, billingCycle) => {
  if (billingCycle === 'monthly') {
    return {
      ...rawPlan,
      monthly: rawPlan.monthly,
      annual: rawPlan.monthly * 12,
    }
  } else {
    const annualTotal = rawPlan.monthly * 12 * 0.8
    const roundedAnnual = Math.round(annualTotal * 100) / 100
    return {
      ...rawPlan,
      monthly: rawPlan.monthly,
      annual: roundedAnnual,
    }
  }
}

// FAQ data
const FAQS = [
  {
    q: 'How does per-project pricing work?',
    a: 'Each project gets its own plan — Free, Starter or Pro. You choose the plan per project when deploying. You can have some projects on Free and others on Pro.',
  },
  {
    q: 'What runtimes are supported?',
    a: 'Free supports static sites only. Starter supports Node.js, Go, Python. Pro adds Java. More coming soon (Rust, .NET).',
  },
  {
    q: 'Can I upgrade a project anytime?',
    a: 'Yes. You can upgrade any project from Free → Starter → Pro at any time from your project settings or billing page.',
  },
  {
    q: 'Do annual discounts apply automatically?',
    a: 'Yes — choose yearly billing at checkout and save 20% on Starter and Pro plans.',
  },
  {
    q: 'Do you support databases?',
    a: 'Not yet — but it is coming. For now you can connect to any external DB (PlanetScale, Supabase, MongoDB Atlas).',
  },
]

export default function Pricing() {
  useReveal()
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = RAW_PLANS.map((raw) => getPlanWithBilling(raw, billingCycle))

  const formatPrice = (plan) => {
    if (billingCycle === 'monthly') {
      if (plan.monthly === 0) return 'Free'
      return `$${plan.monthly}/mo`
    } else {
      if (plan.annual === 0) return 'Free'
      return `$${plan.annual}/year`
    }
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* HEADER */}
      <section className="py-16 px-6 text-center">
        <div className="reveal mb-4 inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
          Pricing
        </div>
        <h1 className="reveal font-syne font-black text-5xl md:text-6xl tracking-tight mb-4 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          Pay per project.
        </h1>
        <p className="reveal text-gray-300 text-lg max-w-lg mx-auto mb-4 font-light">
          Each project gets its own plan. Start free, upgrade only the projects that need more power.
        </p>
        <p className="reveal text-sm text-gray-500 mb-8">No account-level plans. No surprises.</p>

        {/* Billing Toggle */}
        <div className="reveal flex justify-center gap-3 mb-14">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Yearly
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-left px-4">
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.name}
              plan={{
                ...plan,
                priceDisplay: formatPrice(plan),
                features: plan.featuresList,
                monthly: plan.monthly,
                annual: plan.annual ?? plan.monthly * 12,
              }}
              annual={billingCycle === 'yearly'}
              delay={i * 100}
            />
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="reveal text-center mb-10">
          <h2 className="font-syne font-black text-3xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Compare plans
          </h2>
          <p className="text-gray-500 mt-2">Everything you get, side by side</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-gray-400 font-semibold">Feature</th>
                <th className="py-4 px-4 text-cyan-400 font-semibold">Free</th>
                <th className="py-4 px-4 text-cyan-400 font-semibold">Starter</th>
                <th className="py-4 px-4 text-cyan-400 font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm">
              <tr className="border-b border-white/5"><td className="py-3 px-4">Static site hosting</td><td className="py-3 px-4">✅</td><td className="py-3 px-4">✅</td><td className="py-3 px-4">✅</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">Backend runtimes</td><td className="py-3 px-4">❌ None</td><td className="py-3 px-4">Node.js, Go, Python</td><td className="py-3 px-4">+ Java</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">Custom domain</td><td className="py-3 px-4">❌</td><td className="py-3 px-4">✅</td><td className="py-3 px-4">✅</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">RAM / CPU</td><td className="py-3 px-4">Shared</td><td className="py-3 px-4">256 MB / 0.5 vCPU</td><td className="py-3 px-4">512 MB / 1 vCPU</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">Storage</td><td className="py-3 px-4">Fair use</td><td className="py-3 px-4">5 GB</td><td className="py-3 px-4">10 GB</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">Alerts (Email/Discord/Telegram)</td><td className="py-3 px-4">✅</td><td className="py-3 px-4">✅</td><td className="py-3 px-4">✅</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">GitHub CI/CD</td><td className="py-3 px-4">❌</td><td className="py-3 px-4">✅</td><td className="py-3 px-4">✅</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">AI Diagnostics</td><td className="py-3 px-4">❌</td><td className="py-3 px-4">❌</td><td className="py-3 px-4">✅</td></tr>
              <tr className="border-b border-white/5"><td className="py-3 px-4">Uptime monitoring</td><td className="py-3 px-4">❌</td><td className="py-3 px-4">❌</td><td className="py-3 px-4">✅</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="reveal font-syne font-black text-3xl text-center mb-12 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Frequently asked
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} delay={i * 80} />
          ))}
        </div>
      </section>
    </div>
  )
}