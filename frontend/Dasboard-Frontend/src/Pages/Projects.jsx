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

function Icon({ path }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

export default function Projects() {
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#070b12] px-6 py-8 shadow-2xl shadow-black/25 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/50 to-transparent" />
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border border-[#00e5ff]/15 bg-[#00e5ff]/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#00e5ff]">
            Deployment Studio
          </div>
          <h1 className="font-syne text-3xl font-black text-white sm:text-4xl">
            What are you shipping today?
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Choose the runtime first. The next screen will lock the right project type, plan rules, and payment flow for that deployment.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TYPES.map((type) => (
          <Link
            key={type.key}
            to={`/projects/new/${type.key}`}
            className="group relative min-h-56 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080c12] p-5 transition-all hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl hover:shadow-black/30"
          >
            <div className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: type.color }} />
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ color: type.color, background: `${type.color}12`, borderColor: `${type.color}35` }}>
                <Icon path={type.icon} />
              </div>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-gray-400">
                {type.plan}
              </span>
            </div>
            <div className="mt-6">
              <h2 className="font-syne text-xl font-black text-white">{type.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{type.desc}</p>
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-sm font-bold" style={{ color: type.color }}>
              Configure project
              <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
