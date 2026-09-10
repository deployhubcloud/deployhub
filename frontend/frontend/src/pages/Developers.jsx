import { useState } from "react";
import { ClosingCTA, Icon, SectionHeading } from "../components/ui";

const team = [
  {
    name: "Rahul Kumar",
    role: "Founder · Full-Stack & DevOps",
    bio: "Building the deployment engine, Docker pipeline, real-time logs, domain automation, and dashboard. Connecting the code with the infrastructure that runs it.",
    picture: "https://avatars.githubusercontent.com/u/161327448?v=4",
    github: "https://github.com/rahulkumar6777",
    skills: ["Node.js", "React", "Docker", "Nginx", "Redis", "Linux"],
  },
  {
    name: "Karishma Choudhary",
    role: "Backend Developer",
    bio: "Working on authentication and user management. Bringing care to the accounts, permissions, and backend services behind the experience.",
    picture: "https://avatars.githubusercontent.com/u/228013236?v=4",
    github: "https://github.com/karyshmaa",
    skills: ["Spring Boot", "PostgreSQL", "API Design"],
  },
  {
    name: "Kunal Kumar Rajak",
    role: "Frontend Developer",
    bio: "Turning ideas into responsive React interfaces. Bringing the pieces together into an experience that feels clear and easy to use.",
    picture: "https://avatars.githubusercontent.com/u/167686716?v=4",
    github: "https://github.com/Kunalcoder71",
    skills: ["React", "Tailwind CSS", "JavaScript", "Figma"],
  },
];
function Avatar({ member }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="team-avatar">
      {failed ? (
        <span aria-label={member.name}>
          {member.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </span>
      ) : (
        <img
          src={member.picture}
          alt={member.name}
          width="160"
          height="160"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
export default function Developers() {
  return (
    <>
      <section className="container page-hero centered">
        <span className="eyebrow">THE PEOPLE BEHIND THE PLATFORM</span>
        <h1>
          Builders, <span>just like you.</span>
        </h1>
        <p>
          A small team working across code, design, and infrastructure—with a
          shared belief that getting your ideas online should feel simpler.
        </p>
      </section>
      <section className="container team-grid" aria-label="DeployHub team">
        {team.map((member, index) => (
          <article className="team-card" key={member.name}>
            <div className="team-portrait">
              <span className="eyebrow">THE TEAM / 0{index + 1}</span>
              <Avatar member={member} />
              <span className="portrait-decoration" aria-hidden="true">
                +
              </span>
            </div>
            <div className="team-content">
              <span className="team-role">{member.role}</span>
              <h2>{member.name}</h2>
              <p>{member.bio}</p>
              <div className="skill-tags">
                {member.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <a
                className="text-link"
                href={member.github}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub profile
                <Icon name="external" size={15} />
              </a>
            </div>
          </article>
        ))}
      </section>
      <section className="container section team-principles">
        <SectionHeading
          eyebrow="HOW WE WORK"
          title="Different skills. One shared workspace."
          description="From the first interface to the service behind it, every part of DeployHub is connected."
        />
        <div className="team-disciplines">
          {[
            ["code", "Frontend", "The experience you see."],
            ["box", "Backend", "The services you rely on."],
            ["branch", "Infrastructure", "The path from code to production."],
          ].map(([icon, title, text]) => (
            <div key={title}>
              <Icon name={icon} size={23} />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <ClosingCTA />
    </>
  );
}
