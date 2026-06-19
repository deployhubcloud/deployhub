import { useEffect } from "react";
import { useLaunchModal } from "../lib/launch-modal";

const SOCIALS = [
  {
    name: "Discord",
    href: "https://discord.gg/auGdZcJE4N",
    color: "hover:bg-[#5865F2] hover:border-[#5865F2]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/deployhub_",
    color: "hover:bg-gradient-to-tr hover:from-[#feda75] hover:via-[#d62976] hover:to-[#4f5bd5] hover:border-transparent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "",
    color: "hover:bg-[#0A66C2] hover:border-[#0A66C2]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
    ),
  },
];

export default function LaunchingSoonModal() {
  const { open, closeLaunch } = useLaunchModal();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") closeLaunch(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeLaunch]);

  if (!open) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={closeLaunch}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-in relative w-full max-w-md rounded-2xl border border-cyan/30 bg-white dark:bg-[#0d1117] shadow-2xl shadow-cyan/20 overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-hero-glow opacity-80" />
        <button
          onClick={closeLaunch}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>

        <div className="p-7 pt-9 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan pulse-dot" />
            Coming soon
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            We're <span className="grad-text">launching soon!</span>
          </h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Signups, logins, and plan checkout aren't live yet. DeployHub is going to market shortly — follow us on our socials to be the first to know when we open the doors.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-4 text-gray-700 dark:text-gray-300 transition-all hover:-translate-y-0.5 hover:text-white ${s.color}`}
              >
                {s.icon}
                <span className="text-xs font-medium">{s.name}</span>
              </a>
            ))}
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-wider text-gray-500">
            Thanks for the love — see you on launch day.
          </p>
        </div>
      </div>
    </div>
  );
}
