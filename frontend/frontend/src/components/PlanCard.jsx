import { useLaunchModal } from "../lib/launch-modal";

export default function PlanCard({ plan, annual, delay = 0 }) {
  const { openLaunch } = useLaunchModal();

  return (
    <div
      className={`reveal rounded-2xl p-7 relative transition-all duration-300 ${
        plan.highlight
          ? "bg-white dark:bg-[#111827] border-2 border-cyan/50 shadow-2xl shadow-cyan/10"
          : "bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-cyan to-violet text-black text-xs font-black px-4 py-1 rounded-full tracking-wide uppercase">{plan.badge}</span>
        </div>
      )}
      <div className="font-sans font-bold text-xl mb-1 text-gray-900 dark:text-white">{plan.name}</div>
      <p className="text-gray-600 dark:text-gray-500 text-sm mb-5 leading-relaxed">{plan.desc}</p>
      <div className="flex items-end gap-1 mb-6">
        {plan.monthly !== 0 && <span className="text-gray-500 dark:text-gray-400 text-lg mb-1">$</span>}
        <span className="font-sans font-bold text-5xl leading-none text-gray-900 dark:text-white">{plan.monthly === 0 ? "Free" : annual ? plan.annual : plan.monthly}</span>
        {plan.monthly !== 0 && <span className="text-gray-500 dark:text-gray-500 text-sm mb-1">/{annual ? "year" : "mo"}</span>}
      </div>
      <ul className="space-y-3 mb-7">
        {plan.features.map((feature) => (
          <li key={feature.label} className={`flex items-center gap-3 text-sm ${feature.ok ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-600"}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${feature.ok ? "bg-emerald-400/20 text-emerald-400" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600"}`}>
              {feature.ok ? "✓" : "–"}
            </span>
            {feature.label}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={openLaunch}
        className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.ctaStyle === "solid" ? "bg-cyan text-black hover:bg-cyan-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/30" : "border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:border-cyan/50 hover:text-cyan"}`}
      >
        {plan.cta}
      </button>
    </div>
  );
}
