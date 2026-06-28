import { Link } from "react-router-dom";

const SOCIALS = [
  { name: "Discord", href: "https://discord.gg/deployhub", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
  )},
  { name: "Instagram", href: "https://instagram.com/deployhub", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  )},
  { name: "LinkedIn", href: "https://linkedin.com/company/deployhub", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  )},
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0b]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
                <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
              </svg>
            </span>
            <span className="text-white">DeployHub</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-neutral-500">Serious infrastructure, made simple. Ship sites and services from GitHub in seconds.</p>
          <div className="mt-4 flex gap-2 text-neutral-400">
            {SOCIALS.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="rounded-md border border-white/10 p-2 hover:text-amber-400 hover:border-amber-500/30 transition-colors">
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Product</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/pricing" className="text-neutral-500 hover:text-white transition">Pricing</Link></li>
            <li><Link to="/about" className="text-neutral-500 hover:text-white transition">About</Link></li>
            <li><Link to="/developers" className="text-neutral-500 hover:text-white transition">Developers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><span className="text-neutral-500">Static hosting</span></li>
            <li><span className="text-neutral-500">Backend runtimes</span></li>
            <li><span className="text-neutral-500">Custom domains</span></li>
            <li><span className="text-neutral-500">AI diagnostics</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Get started</h4>
          <p className="mt-3 text-sm text-neutral-500">DeployHub is live now. Start shipping your projects.</p>
          <a
            href="https://dashboard.deployhub.cloud/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-md bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-medium text-black transition-colors"
          >
            Open Dashboard
          </a>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-neutral-600 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>© 2026 DeployHub. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition">Privacy</span>
            <span className="hover:text-white cursor-pointer transition">Terms</span>
            <span className="hover:text-white cursor-pointer transition">Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}