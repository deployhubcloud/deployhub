import { Link } from "react-router-dom";
import {
  ClosingCTA,
  DashboardLink,
  Icon,
  Logo,
  SectionHeading,
} from "../components/ui";

export default function About() {
  return (
    <>
      <section className="container about-hero page-hero">
        <div>
          <span className="eyebrow">WHY WE’RE BUILDING DEPLOYHUB</span>
          <h1>
            Good ideas deserve
            <br />
            <span>to get out there.</span>
          </h1>
          <p>
            There’s a moment between “it works on my machine” and sharing it
            with the world. We’re here to make that moment simpler.
          </p>
          <DashboardLink>Make room for your idea</DashboardLink>
        </div>
        <div className="about-art" aria-label="From your code to the web">
          <div className="about-ring ring-outer" />
          <div className="about-ring ring-inner" />
          <span className="orbit-label orbit-code">
            <Icon name="code" />
            Your code
          </span>
          <div className="about-logo">
            <Logo compact />
          </div>
          <span className="orbit-label orbit-web">
            <Icon name="globe" />
            Out in the world
          </span>
          <span className="art-caption">A HOME FOR WHAT YOU BUILD</span>
        </div>
      </section>
      <section className="container story-section section">
        <span className="eyebrow">OUR POINT OF VIEW</span>
        <div>
          <h2>
            Build the thing you care about.
            <br />
            <span className="accent">
              We’ll help with the path to production.
            </span>
          </h2>
          <p>
            DeployHub brings project setup, deployments, domains, logs, and
            monitoring into one workspace. It’s a platform for developers who
            want to understand their applications without spending every day
            managing infrastructure.
          </p>
          <p>
            Your repository stays your source of truth. Your build commands,
            environment variables, and runtime settings stay in your hands.
          </p>
        </div>
      </section>
      <section className="workflow-section">
        <div className="container section">
          <SectionHeading
            eyebrow="UNDER THE SURFACE"
            title="A clear path from code to the web."
            description="Connected tools, with a job for every step."
          />
          <div className="architecture-list">
            {[
              [
                "branch",
                "Your repository",
                "Connect GitHub and choose the branch and directory you want to deploy.",
              ],
              [
                "terminal",
                "Your build",
                "Run your build commands and follow the output in deployment logs.",
              ],
              [
                "box",
                "Your application",
                "Serve static output or run a backend service in its own container.",
              ],
              [
                "globe",
                "Your audience",
                "Reach your project over HTTPS, with a DeployHub subdomain or a custom domain on a paid plan.",
              ],
            ].map(([icon, title, description], index) => (
              <article key={title}>
                <span className="architecture-number">0{index + 1}</span>
                <span className="feature-icon">
                  <Icon name={icon} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          eyebrow="WHAT GUIDES US"
          title="Thoughtful by default."
        />
        <div className="values-grid">
          {[
            [
              "Clarity over clutter.",
              "The next action should be easy to find. Your workspace should help you think, from the first setup to the next deployment.",
            ],
            [
              "Control where it counts.",
              "Choose your runtime, configure your build, and manage your environment. Simple should still leave room for your way of working.",
            ],
            [
              "Built by people who build.",
              "We work across the frontend, backend, and infrastructure. DeployHub grows from the problems we meet while shipping software.",
            ],
          ].map(([title, text], index) => (
            <article key={title}>
              <span className="eyebrow">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <Link className="text-link section-link" to="/developers">
          Meet the people behind DeployHub <Icon size={17} />
        </Link>
      </section>
      <ClosingCTA />
    </>
  );
}
