import { useState } from "react";
import { Link } from "react-router-dom";

const TYPES = [
  {
    key: "static",
    title: "Static Site",
    desc: "Vite, React, Vue, Astro, docs, portfolios, and marketing sites.",
    plan: "Free",
    color: "#00e5ff",
    icon: "M3 5h18M5 5v14h14V5M8 9h8M8 13h5",
  },
  {
    key: "node",
    title: "Node.js App",
    desc: "Express, APIs, workers, dashboards, and long-running services.",
    plan: "Starter",
    color: "#34d399",
    icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5l-8 4.5-8-4.5",
  },
  {
    key: "go",
    title: "Go Service",
    desc: "Fast HTTP services, background jobs, and small binaries.",
    plan: "Starter",
    color: "#60a5fa",
    icon: "M4 7h10a5 5 0 010 10H4m3-5h11M4 10h3m-3 4h3",
  },
  {
    key: "python",
    title: "Python App",
    desc: "FastAPI, Flask, automation services, and ML-backed APIs.",
    plan: "Starter",
    color: "#fbbf24",
    icon: "M12 4h4a4 4 0 014 4v2h-8a4 4 0 00-4 4v6H8a4 4 0 01-4-4v-4a4 4 0 014-4h8m-4 12H8a4 4 0 01-4-4v-2h8a4 4 0 004-4V4h4a4 4 0 014 4v4a4 4 0 01-4 4h-8",
  },
  {
    key: "java",
    title: "Java Service",
    desc: "Spring Boot and JVM services with Pro resources.",
    plan: "Pro",
    color: "#a78bfa",
    icon: "M8 18h8M10 14h4m-5-3h6a3 3 0 000-6H9v13m3-13v13",
  },
];

function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

export default function Projects() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Single Button - Right Side */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b8d4] px-6 py-3 font-bold text-black transition hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          <Icon path="M12 4v16m8-8H4" className="h-5 w-5" />
          New Deployment
        </button>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0e17] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Select deployment type</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Options Grid */}
            <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1 sm:grid-cols-2">
              {TYPES.map((type) => (
                <Link
                  key={type.key}
                  to={`/projects/new/${type.key}`}
                  onClick={() => setIsModalOpen(false)}
                  className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ color: type.color, background: `${type.color}15`, borderColor: `${type.color}30` }}
                  >
                    <Icon path={type.icon} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white">{type.title}</h3>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-400">
                        {type.plan}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{type.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}