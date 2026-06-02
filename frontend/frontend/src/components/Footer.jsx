import { Link } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
  { to: "/developers", label: "Developers" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#080c10]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-cyan/15 text-cyan ring-1 ring-cyan/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
                <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
              </svg>
            </span>
            <span className="text-gray-900 dark:text-white">DeployHub</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-gray-600 dark:text-gray-500">Serious infrastructure, made simple. Ship sites and services from GitHub in seconds.</p>
          <div className="mt-4 flex gap-2 text-gray-500">
            <a href="#" className="rounded-md border border-gray-200 dark:border-white/10 p-2 hover:text-gray-900 dark:hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></a>
            <a href="#" className="rounded-md border border-gray-200 dark:border-white/10 p-2 hover:text-gray-900 dark:hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
            <a href="#" className="rounded-md border border-gray-200 dark:border-white/10 p-2 hover:text-gray-900 dark:hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg></a>
          </div>
        </div>
        <div><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Product</h4><ul className="mt-3 space-y-2 text-sm"><li><Link to="/pricing" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">Pricing</Link></li><li><Link to="/about" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">About</Link></li><li><Link to="/developers" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">Developers</Link></li></ul></div>
        <div><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Platform</h4><ul className="mt-3 space-y-2 text-sm"><li><a href="#" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">Static hosting</a></li><li><a href="#" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">Backend runtimes</a></li><li><a href="#" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">Custom domains</a></li><li><a href="#" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">AI diagnostics</a></li></ul></div>
        <div><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Get started</h4><p className="mt-3 text-sm text-gray-600 dark:text-gray-500">Connect a GitHub repo and ship in under a minute.</p><a href="#" className="mt-4 inline-flex rounded-md bg-cyan px-4 py-2 text-sm font-medium text-black">Go to dashboard</a></div>
      </div>
      <div className="border-t border-gray-200 dark:border-white/5"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-gray-500 dark:text-gray-600 sm:flex-row sm:items-center sm:px-6 lg:px-8"><p>© 2026 DeployHub. All rights reserved.</p><div className="flex gap-4"><a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a><a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a><a href="#" className="hover:text-gray-900 dark:hover:text-white">Status</a></div></div></div>
    </footer>
  );
}