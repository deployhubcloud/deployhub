import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  CircleAlert,
  GitBranch,
  Layers,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import useResource from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  DataStamp,
  EmptyState,
  RefreshButton,
  ResourceState,
  StatusBadge,
} from "../components/ui";
import { dateTime, number, titleCase } from "../utils";

function Distribution({ values, total }) {
  const entries = Object.entries(values || {}).filter(([, value]) =>
    Number.isFinite(value),
  );
  return (
    <>
      <div
        className="distribution-track"
        aria-label="Project status distribution"
      >
        {entries.map(([key, value], i) => (
          <span
            key={key}
            className={"segment segment-" + (i % 5)}
            style={{ flexGrow: value || 0, display: value ? "block" : "none" }}
            title={titleCase(key) + ": " + number(value)}
          />
        ))}
      </div>
      <div className="distribution-legend">
        {entries.map(([key, value], i) => (
          <Link key={key} to={"/projects?status=" + key}>
            <i className={"segment segment-" + (i % 5)} />
            <span>{titleCase(key)}</span>
            <strong>{number(value)}</strong>
            <small>{total ? Math.round((value / total) * 100) : 0}%</small>
          </Link>
        ))}
      </div>
      {!entries.length && <EmptyState title="Distribution unavailable" />}
    </>
  );
}
export default function OverviewPage() {
  const resource = useResource("/dashboard");
  const { can } = useAuth();
  const activity = useResource(
    "/audit-logs",
    { limit: 5 },
    { enabled: can("audit:read") },
  );
  const data = resource.data;
  const running = data?.projects?.byStatus?.running;
  const total = data?.projects?.total;
  const runningPercent =
    Number.isFinite(running) && total > 0
      ? Math.round((running / total) * 100)
      : null;
  const attention = [
    {
      label: "Failed applications",
      description: "Inspect build and deployment failures",
      value: data?.projects?.byStatus?.failed,
      to: "/projects?status=failed",
      tone: "danger",
    },
    {
      label: "Crashed applications",
      description: "Investigate applications that stopped unexpectedly",
      value: data?.projects?.byStatus?.crash,
      to: "/projects?status=crash",
      tone: "danger",
    },
    {
      label: "Accounts awaiting activation",
      description: "Review pending customer accounts",
      value: data?.users?.byStatus?.pending,
      to: "/users?status=pending",
      tone: "warning",
    },
    {
      label: "Suspended accounts",
      description: "Review restricted account access",
      value: data?.users?.byStatus?.suspend,
      to: "/users?status=suspend",
      tone: "neutral",
    },
  ];
  return (
    <>
      <header className="mission-heading">
        <div>
          <span className="eyebrow">
            <Radio size={13} /> PLATFORM OPERATIONS
          </span>
          <h1>
            Everything in view.
            <br />
            <span>Stay ahead of what’s next.</span>
          </h1>
          <p>
            Your platform’s operational picture, with a clear path to every
            action.
          </p>
        </div>
        <div className="mission-actions">
          <RefreshButton resource={resource} />
          <Link to="/system" className="btn btn-primary">
            Open infrastructure <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <ResourceState resource={resource}>
        {data && (
          <>
            <div className="metric-ribbon">
              {[
                [
                  "Customers",
                  data.users?.total,
                  "Registered accounts",
                  "/users",
                  Users,
                ],
                [
                  "Applications",
                  total,
                  "Across all runtimes",
                  "/projects",
                  Boxes,
                ],
                [
                  "Build executions",
                  data.builds?.total,
                  "Recorded build history",
                  "/projects",
                  GitBranch,
                ],
                [
                  "Deployments",
                  data.deployments?.total,
                  "Recorded deployments",
                  "/projects",
                  Layers,
                ],
              ].map(([label, value, note, to, Symbol]) => (
                <Link key={label} to={to}>
                  <div>
                    <Symbol size={16} />
                    <span>{label}</span>
                    <ArrowUpRight size={14} />
                  </div>
                  <strong>{number(value)}</strong>
                  <small>{note}</small>
                </Link>
              ))}
            </div>
            <div className="operations-layout">
              <div className="operations-primary">
                <section className="portfolio-surface">
                  <div className="section-topline">
                    <div>
                      <span className="eyebrow">APPLICATION PORTFOLIO</span>
                      <h2>
                        From a bird’s-eye view
                        <br />
                        to the details that matter.
                      </h2>
                    </div>
                    <Link
                      className="round-link"
                      to="/projects"
                      aria-label="Explore project portfolio"
                    >
                      <ArrowUpRight size={22} />
                    </Link>
                  </div>
                  <div className="portfolio-body">
                    <div className="portfolio-number">
                      <strong>
                        {runningPercent == null ? "—" : runningPercent}
                        <span>{runningPercent == null ? "" : "%"}</span>
                      </strong>
                      <p>of applications running</p>
                      <span>
                        {number(running)} of {number(total)} applications
                      </span>
                    </div>
                    <div className="portfolio-distribution">
                      <Distribution
                        values={data.projects?.byStatus}
                        total={total}
                      />
                    </div>
                  </div>
                  <div className="portfolio-bottom">
                    <span>
                      <Boxes size={14} /> Platform-wide application status
                    </span>
                    <Link to="/projects?view=board">
                      Explore board <ArrowRight size={14} />
                    </Link>
                  </div>
                </section>
                <section className="triage-surface">
                  <div className="section-topline">
                    <div>
                      <span className="eyebrow">YOUR NEXT ACTION</span>
                      <h2>Attention inbox</h2>
                    </div>
                    <span className="soft-label">Current snapshot</span>
                  </div>
                  <div className="triage-rows">
                    {attention.map((item, i) => (
                      <Link to={item.to} key={item.label}>
                        <span className="triage-index">0{i + 1}</span>
                        <span className={"triage-signal " + item.tone}>
                          <CircleAlert size={17} />
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </div>
                        <span className="triage-count">
                          {number(item.value)}
                        </span>
                        <ArrowUpRight size={16} />
                      </Link>
                    ))}
                  </div>
                </section>
                <section className="plan-strip">
                  <div>
                    <span className="eyebrow">PLAN DISTRIBUTION</span>
                    <h3>How your platform is used</h3>
                  </div>
                  {Object.entries(data.projects?.byPlan || {}).map(
                    ([plan, value]) => (
                      <Link to={"/projects?plan=" + plan} key={plan}>
                        <span>{titleCase(plan)}</span>
                        <strong>{number(value)}</strong>
                        <ArrowUpRight size={13} />
                      </Link>
                    ),
                  )}
                  {!data.projects?.byPlan && (
                    <span className="muted">Plan data unavailable</span>
                  )}
                </section>
              </div>
              <aside className="operations-aside">
                <section className="source-monitor">
                  <div className="section-topline">
                    <h2>
                      <Radio size={16} /> Service connections
                    </h2>
                  </div>
                  <p>Availability of the sources behind this snapshot.</p>
                  {[
                    ["users", "Identity"],
                    ["projects", "Projects"],
                    ["builds", "Builds"],
                    ["deployments", "Deployments"],
                  ].map(([key, label]) => {
                    const available = data.availability
                      ? data.availability[key]
                      : Boolean(data[key]);
                    return (
                      <div className="monitor-row" key={key}>
                        <span
                          className={
                            available
                              ? "monitor-light"
                              : "monitor-light unavailable"
                          }
                        />
                        <span>{label}</span>
                        {available ? (
                          <Check size={14} />
                        ) : (
                          <CircleAlert size={14} />
                        )}
                        <small>{available ? "Connected" : "Unavailable"}</small>
                      </div>
                    );
                  })}
                  <Link to="/system">
                    Inspect infrastructure <ArrowRight size={14} />
                  </Link>
                </section>
                <section className="activity-stream">
                  <div className="section-topline">
                    <h2>Workspace activity</h2>
                    <Activity size={16} />
                  </div>
                  {can("audit:read") ? (
                    <ResourceState resource={activity}>
                      {activity.data?.logs?.length ? (
                        <ol>
                          {activity.data.logs.map((log) => (
                            <li key={log._id}>
                              <span className="event-dot" />
                              <div>
                                <strong>{log.actorUsername}</strong>
                                <p>{log.action}</p>
                                <small>{dateTime(log.createdAt)}</small>
                                <StatusBadge
                                  value={
                                    log.statusCode >= 400 ? "failed" : "success"
                                  }
                                />
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <EmptyState title="No recent activity" />
                      )}
                    </ResourceState>
                  ) : (
                    <p>Activity logs require additional access.</p>
                  )}
                  <Link to="/audit-logs">
                    Open activity log <ArrowRight size={14} />
                  </Link>
                </section>
                <div className="workspace-note">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>A workspace with context.</strong>
                    <p>
                      Use <kbd>⌘ K</kbd> or <kbd>Ctrl K</kbd> to find a
                      customer, application, or page.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
            <DataStamp resource={resource} />
          </>
        )}
      </ResourceState>
    </>
  );
}
