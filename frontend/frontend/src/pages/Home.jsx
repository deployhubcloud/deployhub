import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClosingCTA,
  DashboardLink,
  Icon,
  Logo,
  SectionHeading,
} from "../components/ui";
import { runtimes } from "../data";

function RuntimeExplorer() {
  const [selected, setSelected] = useState("static");
  const runtime = runtimes.find((item) => item.id === selected);
  return (
    <div className="runtime-explorer">
      <div className="explorer-chrome">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>YOUR NEXT DEPLOYMENT</span>
        <Icon name="code" size={15} />
      </div>
      <div className="explorer-body">
        <div className="explorer-title">
          <span className="eyebrow">01 / CHOOSE YOUR STACK</span>
          <span className="small-tag">5 runtimes</span>
        </div>
        <div className="runtime-tabs" aria-label="Explore runtimes">
          {runtimes.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected === item.id}
              onClick={() => setSelected(item.id)}
            >
              <span>{item.mark}</span>
              {item.name}
            </button>
          ))}
        </div>
        <div className="deployment-map" aria-hidden="true">
          <div className="map-grid" />
          <div className="map-node source-node">
            <Icon name="branch" size={23} />
            <span>Your repo</span>
          </div>
          <div className="map-connection" />
          <div className="map-hub">
            <Logo compact />
          </div>
          <div className="map-connection" />
          <div className="map-node output-node">
            <Icon name={runtime.icon} size={23} />
            <span>Your {selected === "static" ? "site" : "service"}</span>
          </div>
        </div>
        <div className="runtime-detail" aria-live="polite">
          <div>
            <span className="eyebrow">{runtime.kind}</span>
            <h3>{runtime.description}</h3>
            <p>{runtime.detail}</p>
          </div>
          <DashboardLink
            className="text-link"
            path={`/projects/new/${selected}`}
          >
            Create {runtime.name} project
          </DashboardLink>
        </div>
      </div>
      <div className="explorer-footer">
        <Icon name="shield" size={15} />
        <span>Your code. Your configuration. One workspace.</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="container home-hero">
        <div className="hero-copy">
          <div className="hero-label">
            <span className="label-line" /> BUILT FOR YOUR NEXT BIG THING
          </div>
          <h1>
            A home for
            <br />
            what you <span>build.</span>
          </h1>
          <p>
            From a side project to your next big idea. Deploy websites and
            backend services from GitHub, and keep everything in one calm
            workspace.
          </p>
          <div className="hero-actions">
            <DashboardLink>Start building</DashboardLink>
            <Link className="button secondary" to="/about">
              Explore the platform <Icon size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span>
              <Icon name="check" size={14} /> Free static hosting
            </span>
            <span>
              <Icon name="check" size={14} /> Your favorite stack
            </span>
          </div>
        </div>
        <RuntimeExplorer />
      </section>
      <section
        className="container runtime-strip"
        aria-label="Supported runtimes"
      >
        <p>
          YOUR STACK.
          <br />
          <strong>RIGHT AT HOME.</strong>
        </p>
        <div>
          {runtimes.map((runtime) => (
            <DashboardLink
              key={runtime.id}
              className="runtime-link"
              path={`/projects/new/${runtime.id}`}
            >
              <span className="runtime-mark">{runtime.mark}</span>
              {runtime.name}
            </DashboardLink>
          ))}
        </div>
      </section>
      <section className="container section features-section">
        <div className="section-top">
          <SectionHeading
            eyebrow="A LITTLE LESS INFRASTRUCTURE"
            title={
              <>
                Everything your project needs.
                <br />
                Space to focus on what matters.
              </>
            }
            description="The tools to ship, understand, and look after your applications, brought together."
          />
          <Link className="text-link" to="/pricing">
            Compare plans <Icon size={16} />
          </Link>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-wide">
            <div className="feature-icon">
              <Icon name="branch" />
            </div>
            <h3>From repository to possibility.</h3>
            <p>
              Connect GitHub, pick a branch, and configure your build. With
              auto-deploy on paid plans, your next push can become your next
              release.
            </p>
            <div className="commit-flow" aria-hidden="true">
              <span>
                <Icon name="branch" size={15} /> main
              </span>
              <i />
              <span>
                <Icon name="box" size={15} /> Build
              </span>
              <i />
              <span className="flow-last">
                <Icon name="globe" size={15} /> Deploy
              </span>
            </div>
            <span className="card-caption">
              YOUR WORKFLOW, WITH FEWER STEPS
            </span>
          </article>
          <article className="feature-card">
            <div className="feature-icon">
              <Icon name="globe" />
            </div>
            <h3>Your own corner of the web.</h3>
            <p>
              Start with a DeployHub subdomain. Bring a custom domain on a paid
              plan, with SSL handled for you.
            </p>
            <div className="domain-illustration">
              <Icon name="shield" size={18} />
              <span>
                your next idea<span className="accent">.com</span>
              </span>
              <Icon name="check" size={16} />
            </div>
          </article>
          <article className="feature-card">
            <div className="feature-icon">
              <Icon name="terminal" />
            </div>
            <h3>Know what’s happening.</h3>
            <p>
              Follow builds and runtime logs in your dashboard. See the details
              you need when a deployment needs attention.
            </p>
            <div className="log-illustration" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          </article>
          <article className="feature-card">
            <div className="feature-icon">
              <Icon name="box" />
            </div>
            <h3>A space of its own.</h3>
            <p>
              Backend services run in isolated containers with resources defined
              by your project’s plan.
            </p>
            <div className="container-illustration" aria-hidden="true">
              <Icon name="box" size={32} />
              <Icon name="box" size={32} />
              <Icon name="box" size={32} />
            </div>
          </article>
          <article className="feature-card">
            <div className="feature-icon">
              <Icon name="activity" />
            </div>
            <h3>A clearer view of production.</h3>
            <p>
              Pro adds uptime monitoring and AI diagnostics to help you
              understand the health of your application.
            </p>
            <Link to="/pricing" className="text-link">
              Explore Pro <Icon size={16} />
            </Link>
          </article>
        </div>
      </section>
      <section className="workflow-section">
        <div className="container section">
          <SectionHeading
            eyebrow="FROM IDEA TO INTERNET"
            title="A familiar flow. A fresh start."
            description="Bring your code. We’ll help you take it from there."
          />
          <ol className="steps-grid">
            {[
              {
                title: "Pick your project type",
                text: "Static, Node.js, Java, Go, or Python. Choose the runtime that fits what you’re building.",
              },
              {
                title: "Make it your own",
                text: "Choose a plan, connect a repository, and set your build commands and environment variables.",
              },
              {
                title: "Ship and stay in the loop",
                text: "Deploy your project, follow its logs, and manage future changes from your workspace.",
              },
            ].map((step, index) => (
              <li key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <ClosingCTA />
    </>
  );
}
