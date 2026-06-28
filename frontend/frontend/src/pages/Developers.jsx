import { useState, useEffect } from "react";
import useReveal from "../hooks/useReveal";

const TEAM = [
  {
    name: "Rahul Kumar", role: "Founder · Full-Stack & DevOps",
    bio: "Built DeployHub from scratch — the deployment engine, Docker pipeline, CI/CD, real-time log streaming, custom domain SSL automation, reverse proxy router, and dashboard. Both the code and the infrastructure.",
    pic: "https://avatars.githubusercontent.com/u/161327448?v=4",
    github: "https://github.com/rahulkumar6777", linkedin: "",
    skills: ["Node.js", "React", "Docker", "Nginx", "Redis", "BullMQ", "CI/CD", "Linux"],
    isLead: true
  },
  {
    name: "Karishma Choudhary", role: "Backend Developer",
    bio: "Owns auth and user management. Signups, logins, permissions, and security — all rock solid.",
    pic: "https://avatars.githubusercontent.com/u/228013236?v=4",
    github: "https://github.com/karyshmaa", linkedin: "",
    skills: ["Spring Boot", "PostgreSQL", "API Design"],
    isLead: false
  },
  {
    name: "Kunal Kumar Rajak", role: "Frontend Developer",
    bio: "Translates designs into clean, responsive React interfaces. Fast components, smooth UX.",
    pic: "https://avatars.githubusercontent.com/u/167686716?v=4",
    github: "https://github.com/Kunalcoder71", linkedin: "",
    skills: ["React", "Tailwind CSS", "JavaScript", "Figma"],
    isLead: false
  },
];

const LOADER_LINES = [
  { text: "> assembling team...", color: "text-amber-400", delay: 0 },
  { text: "  ✔ Rahul Kumar (Lead)", color: "text-emerald-400", delay: 800 },
  { text: "  ✔ Karishma Choudhary", color: "text-emerald-400", delay: 1200 },
  { text: "  ✔ Kunal Kumar Rajak", color: "text-emerald-400", delay: 2000 },
  { text: "  ✔ team assembled! 🚀", color: "text-amber-400", delay: 3800 },
];

export default function Developers() {
  useReveal();
  const [showLoader, setShowLoader] = useState(true);
  const [typedLines, setTypedLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timeouts = [];
    LOADER_LINES.forEach(line => {
      const timeout = setTimeout(() => setTypedLines(prev => [...prev, line]), line.delay);
      timeouts.push(timeout);
    });
    const finalTimeout = setTimeout(() => {
      setShowLoader(false);
      setTimeout(() => setShowContent(true), 100);
    }, 4200);
    timeouts.push(finalTimeout);
    return () => timeouts.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!showLoader) return;
    const blink = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(blink);
  }, [showLoader]);

  const getInitials = (name) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pt-16 bg-page text-primary">
      {/* Loader */}
      {showLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-page">
          <div className="w-full max-w-md px-6">
            <div className="bg-[#111114] rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-amber-500/10 bg-[#0a0a0b]">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-auto text-[10px] text-neutral-500 font-mono tracking-wider">deployhub • team assemble</span>
              </div>
              <div className="p-5 font-mono text-sm leading-[1.9] min-h-[280px]">
                {typedLines.map((line, i) => (
                  <div key={i} className={line.color}>{line.text}</div>
                ))}
                {typedLines.length < LOADER_LINES.length && (
                  <div className="text-amber-400">
                    <span className="inline-block w-2 h-4 bg-amber-400 align-middle" style={{ opacity: cursorVisible ? 1 : 0 }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* Hero */}
        <section className="relative isolate overflow-hidden pb-10 pt-20">
          <div className="absolute inset-0 -z-10 bg-hero-glow" />
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                Developers
              </span>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl text-white">
                The team behind DeployHub.
              </h2>
              <p className="mt-3 text-pretty text-base text-neutral-400 sm:text-lg">
                A small group of engineers building infrastructure we wanted to use ourselves.
              </p>
            </div>
          </div>
        </section>

        {/* Team grid */}
        <section className="pb-20 pt-4">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {TEAM.map((member, i) => (
                <div
                  key={member.name}
                  className={`reveal relative flex h-full flex-col rounded-2xl border bg-[#111114] p-6 transition-colors ${
                    member.isLead ? "border-amber-500/30" : "border-white/[0.06] hover:border-amber-500/30"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {member.isLead && (
                    <span className="absolute right-4 top-4 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/30">
                      Lead
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    {member.pic ? (
                      <img src={member.pic} alt={member.name} className="h-14 w-14 rounded-full object-cover shadow-xl border border-white/10" />
                    ) : (
                      <div className="grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 text-base font-semibold text-white ring-1 ring-white/10">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-neutral-400">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-neutral-400">{member.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {member.skills.map(skill => (
                      <span key={skill} className="rounded-full border border-white/[0.06] bg-[#0a0a0b] px-2.5 py-1 text-[11px] text-neutral-500">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex gap-2 text-neutral-500">
                    {member.github && (
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/10 p-1.5 hover:text-amber-400 hover:border-amber-500/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                      </a>
                    )}
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/10 p-1.5 hover:text-amber-400 hover:border-amber-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                          <rect width="4" height="12" x="2" y="9" />
                          <circle cx="4" cy="4" r="2" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}