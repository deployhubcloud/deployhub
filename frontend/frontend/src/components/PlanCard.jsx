import { useState } from "react";

// supported runtimes for each plan
const RUNTIMES = {
  Free: null, // direct redirect to static
  Starter: [
    { label: "Static", slug: "static" },
    { label: "Node.js", slug: "node" },
    { label: "Go", slug: "go" },
    { label: "Python", slug: "python" },
  ],
  Pro: [
    { label: "Static", slug: "static" },
    { label: "Node.js", slug: "node" },
    { label: "Go", slug: "go" },
    { label: "Python", slug: "python" },
    { label: "Java", slug: "java" },
  ],
};

export default function PlanCard({ plan, annual, delay = 0 }) {
  const [showRuntimes, setShowRuntimes] = useState(false);
  const runtimes = RUNTIMES[plan.name] || null;

  const handleMainClick = () => {
    if (plan.name === "Free") {
      // direct redirect to static project creation
      window.open("https://dashboard.deployhub.cloud/projects/new/static", "_blank");
    } else {
      setShowRuntimes(!showRuntimes);
    }
  };

  const handleRuntimeSelect = (slug) => {
    window.open(`https://dashboard.deployhub.cloud/projects/new/${slug}`, "_blank");
    setShowRuntimes(false);
  };

  return (
    <div
      className={`reveal rounded-2xl p-7 relative transition-all duration-300 ${
        plan.highlight
          ? "bg-[#111114] border-2 border-amber-500/30 shadow-2xl shadow-amber-500/10"
          : "bg-[#111114] border border-white/[0.06]"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black px-4 py-1 rounded-full tracking-wide uppercase">{plan.badge}</span>
        </div>
      )}
      <div className="font-sans font-bold text-xl mb-1 text-white">{plan.name}</div>
      <p className="text-neutral-500 text-sm mb-5 leading-relaxed">{plan.desc}</p>
      <div className="flex items-end gap-1 mb-6">
        {plan.monthly !== 0 && <span className="text-neutral-400 text-lg mb-1">₹</span>}
        <span className="font-sans font-bold text-5xl leading-none text-white">{plan.monthly === 0 ? "Free" : annual ? plan.annual : plan.monthly}</span>
        {plan.monthly !== 0 && <span className="text-neutral-500 text-sm mb-1">/{annual ? "year" : "mo"}</span>}
      </div>
      <ul className="space-y-3 mb-7">
        {plan.features.map((feature) => (
          <li key={feature.label} className={`flex items-center gap-3 text-sm ${feature.ok ? "text-neutral-300" : "text-neutral-600"}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${feature.ok ? "bg-emerald-400/20 text-emerald-400" : "bg-white/5 text-neutral-600"}`}>
              {feature.ok ? "✓" : "–"}
            </span>
            {feature.label}
          </li>
        ))}
      </ul>

      {/* Buttons / Runtime Selector */}
      {runtimes ? (
        <div className="relative">
          <button
            type="button"
            onClick={handleMainClick}
            className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${
              plan.ctaStyle === "solid"
                ? "bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30"
                : "border border-white/10 text-neutral-300 hover:border-amber-500/30 hover:text-amber-400"
            }`}
          >
            {showRuntimes ? "Cancel" : plan.cta}
          </button>

          {showRuntimes && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-[#1a1a1f] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom-2">
              <p className="px-4 py-2 text-xs text-neutral-500 uppercase tracking-wider">Choose a runtime</p>
              {runtimes.map((rt) => (
                <button
                  key={rt.slug}
                  onClick={() => handleRuntimeSelect(rt.slug)}
                  className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                >
                  {rt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // fallback (should not be needed)
        <a
          href="https://dashboard.deployhub.cloud/projects/new/static"
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${
            plan.ctaStyle === "solid"
              ? "bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30"
              : "border border-white/10 text-neutral-300 hover:border-amber-500/30 hover:text-amber-400"
          }`}
        >
          {plan.cta}
        </a>
      )}
    </div>
  );
}