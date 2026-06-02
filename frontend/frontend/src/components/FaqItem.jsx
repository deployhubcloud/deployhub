import { useState } from "react";

export default function FaqItem({ q, a, delay = 0 }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="reveal bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden" style={{ transitionDelay: `${delay}ms` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        <span className="font-medium text-sm text-gray-900 dark:text-white">{q}</span>
        <span className={`text-cyan text-xl leading-none transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</div>}
    </div>
  );
}