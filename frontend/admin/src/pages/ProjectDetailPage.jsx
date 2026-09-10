import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Boxes, ExternalLink, GitBranch, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useResource from "../hooks/useResource";
import {
  ConfirmButton,
  CopyValue,
  DataStamp,
  DetailList,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Panel,
  RefreshButton,
  ResourceState,
  StatCard,
  StatusBadge,
  Tabs,
} from "../components/ui";
import { dateTime, message, safeUrl, titleCase } from "../utils";
const sections = [
  ["Project identity", ["name", "branch", "repoUrl"]],
  [
    "Build & runtime",
    ["buildCommand", "startCommand", "publishDir", "rootDirectory", "port"],
  ],
  [
    "Routing & infrastructure",
    [
      "subdomain",
      "customDomains",
      "assignedPort",
      "dockerContainerName",
      "dockerImage",
      "networkName",
    ],
  ],
  ["Administrative overrides", ["status", "plan", "paymentStatus"]],
];
const options = {
  status: [
    "draft",
    "pending_payment",
    "queued",
    "building",
    "deploying",
    "running",
    "failed",
    "stopped",
    "crash",
    "deleted",
  ],
  plan: ["free", "starter", "pro"],
  paymentStatus: ["pending", "paid", "not_required", "failed"],
};
function Configuration({ project, onSaved, canWrite }) {
  const initial = Object.fromEntries(
    sections
      .flatMap(([, fields]) => fields)
      .map((key) => [
        key,
        key === "customDomains"
          ? (project.customDomains || []).join(", ")
          : String(project[key] ?? ""),
      ]),
  );
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const changed = Object.keys(form).filter((key) => form[key] !== initial[key]);
  async function save() {
    const payload = Object.fromEntries(
      changed.map((key) => [
        key,
        key === "customDomains"
          ? form[key]
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : ["port", "assignedPort"].includes(key)
            ? Number(form[key])
            : form[key],
      ]),
    );
    for (const key of ["port", "assignedPort"])
      if (
        key in payload &&
        (!Number.isInteger(payload[key]) ||
          payload[key] < 1 ||
          payload[key] > 65535)
      )
        throw new Error("Ports must be whole numbers between 1 and 65535.");
    if ("name" in payload && !payload.name.trim())
      throw new Error("Project name is required.");
    try {
      await api.patch("/projects/" + project._id, payload);
      toast.success("Project configuration saved");
      onSaved();
    } catch (err) {
      setError(message(err));
      throw err;
    }
  }
  return (
    <div className="configuration-layout">
      <div>
        {sections.map(([title, fields]) => (
          <Panel
            key={title}
            title={title}
            subtitle={
              title === "Administrative overrides"
                ? "Changes here update the project record; they do not run a deployment or issue a refund."
                : undefined
            }
          >
            <div className="form-grid panel-body">
              {fields.map((key) => (
                <label className="field" key={key}>
                  {titleCase(key.replace(/([A-Z])/g, " $1"))}
                  {options[key] ? (
                    <select
                      className="select"
                      disabled={!canWrite}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    >
                      {!options[key].includes(form[key]) && (
                        <option value={form[key]}>
                          {form[key] || "Not set"}
                        </option>
                      )}
                      {options[key].map((value) => (
                        <option value={value} key={value}>
                          {titleCase(value)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      disabled={!canWrite}
                      type={
                        ["port", "assignedPort"].includes(key)
                          ? "number"
                          : "text"
                      }
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </Panel>
        ))}
        <ErrorState error={error} />
      </div>
      <aside className="settings-help">
        <GitBranch size={24} />
        <h3>Review before applying.</h3>
        <p>
          Only changed fields are sent. Build and runtime settings take effect
          when the project is next deployed.
        </p>
        {canWrite && (
          <div className="save-panel">
            <strong>
              {changed.length} unsaved{" "}
              {changed.length === 1 ? "change" : "changes"}
            </strong>
            <ConfirmButton
              className="btn btn-primary full-width"
              label="Save configuration"
              disabled={!changed.length}
              confirmText={
                "Update these fields for " +
                project.name +
                ": " +
                changed
                  .map((key) => titleCase(key.replace(/([A-Z])/g, " $1")))
                  .join(", ") +
                "?"
              }
              onConfirm={save}
            />
            <button
              className="btn btn-ghost full-width"
              disabled={!changed.length}
              onClick={() => {
                setForm(initial);
                setError("");
              }}
            >
              Discard changes
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
function History({ projectId, type, canWrite }) {
  const [params] = useSearchParams();
  const resource = useResource("/projects/" + projectId + "/" + type, {
    page: Math.max(1, Number(params.get("page")) || 1),
    limit: 25,
  });
  const rows = resource.data?.[type] || [];
  const isBuild = type === "builds";
  return (
    <Panel
      title={isBuild ? "Build history" : "Deployment history"}
      subtitle="Paginated records from the service"
      actions={<RefreshButton resource={resource} />}
    >
      <ResourceState resource={resource}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>{isBuild ? "Commit" : "Build"}</th>
                <th>{isBuild ? "Image" : "Container"}</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const log = safeUrl(row.logsUrl || row.logUrl);
                  return (
                    <tr key={row._id}>
                      <td>
                        <StatusBadge
                          value={
                            row.status || row.buildStatus || row.buildStaus
                          }
                        />
                      </td>
                      <td>
                        <CopyValue
                          value={
                            isBuild
                              ? row.commitSha?.slice(0, 8)
                              : row.build?._id || row.build || row.buildId
                          }
                        />
                      </td>
                      <td>
                        <code>
                          {(isBuild ? row.dockerImage : row.containerId) || "—"}
                        </code>
                      </td>
                      <td className="nowrap muted">
                        {dateTime(
                          row.startedAt ||
                            row.deployedAt ||
                            row.createdAt ||
                            row.createdAd,
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {log && (
                            <a
                              className="btn btn-ghost"
                              href={log}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Logs
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {canWrite && (
                            <ConfirmButton
                              label="Delete record"
                              className="btn btn-danger"
                              confirmText={
                                "Permanently delete this " +
                                (isBuild ? "build" : "deployment") +
                                " record?"
                              }
                              onConfirm={async () => {
                                await api.delete(
                                  "/projects/" + type + "/" + row._id,
                                );
                                toast.success("Record deleted");
                                resource.reload();
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title={"No " + type + " found"} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={resource.data?.pagination}
          count={rows.length}
        />
      </ResourceState>
    </Panel>
  );
}
function Orders({ title, rows }) {
  return (
    <Panel title={title}>
      <div className="order-list">
        {rows.length ? (
          rows.map((order) => (
            <article key={order._id}>
              <div>
                <strong>{titleCase(order.plan || "Order")}</strong>
                <StatusBadge value={order.status} />
              </div>
              <p>
                {Number.isFinite(order.amount)
                  ? new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: order.currency || "INR",
                    }).format(order.amount / 100)
                  : "Amount unavailable"}{" "}
                · {order.months || 1} months
              </p>
              <small>{dateTime(order.createdAt)}</small>
              <CopyValue value={order.razorpayPaymentId || order._id} />
            </article>
          ))
        ) : (
          <EmptyState title="No billing records" />
        )}
      </div>
    </Panel>
  );
}
export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();
  const resource = useResource("/projects/" + projectId);
  const { can } = useAuth();
  const navigate = useNavigate();
  const data = resource.data;
  const project = data?.project;
  const canWrite = can("projects:write");
  const tabs = [
    "overview",
    "configuration",
    "domains",
    "builds",
    "deployments",
    "billing",
    "cache",
    ...(canWrite ? ["actions"] : []),
  ];
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "overview";
  const url = safeUrl(data?.urls?.public);
  async function action(method, suffix, success) {
    await api[method]("/projects/" + projectId + suffix);
    toast.success(success);
    resource.reload();
  }
  return (
    <ResourceState resource={resource}>
      {project && (
        <>
          <PageHeader
            eyebrow="PROJECT WORKSPACE"
            back="/projects"
            title={project.name}
            subtitle="Configuration, delivery, and lifecycle for this application."
            actions={
              <>
                <RefreshButton resource={resource} />
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Visit project
                    <ExternalLink size={15} />
                  </a>
                )}
              </>
            }
          />
          <div className="entity-strip">
            <span className="runtime-avatar">
              <Boxes size={22} />
            </span>
            <CopyValue value={project._id} />
            <StatusBadge value={project.status} />
            <span className="plan-tag">
              {project.type} · {project.plan}
            </span>
          </div>
          <div className="stats-grid">
            <StatCard
              label="Build records"
              value={data.counts?.builds}
              icon={GitBranch}
            />
            <StatCard
              label="Deployments"
              value={data.counts?.deployments}
              icon={Boxes}
            />
            <StatCard
              label="SSL certificates"
              value={data.counts?.ssl}
              icon={ShieldCheck}
            />
            <StatCard
              label="Paid orders"
              value={data.counts?.completedOrders}
            />
          </div>
          <Tabs
            items={tabs}
            value={tab}
            onChange={(value) => setParams({ tab: value })}
          />
          {tab === "overview" && (
            <div className="two-columns">
              <Panel title="Application" subtitle="Repository and ownership">
                <DetailList
                  items={[
                    [
                      "Owner",
                      data.owner ? (
                        <Link
                          className="text-link"
                          to={"/users/" + data.owner._id}
                        >
                          {data.owner.fullName} · {data.owner.email}
                        </Link>
                      ) : (
                        <Link
                          className="text-link"
                          to={"/users/" + project.userId}
                        >
                          Owner details
                        </Link>
                      ),
                    ],
                    [
                      "Repository",
                      safeUrl(project.repoUrl) ? (
                        <a
                          className="text-link break-anywhere"
                          href={safeUrl(project.repoUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {project.repoUrl}
                        </a>
                      ) : (
                        project.repoUrl
                      ),
                    ],
                    ["Branch", project.branch],
                    ["Created", dateTime(project.createdAt)],
                    ["Payment", <StatusBadge value={project.paymentStatus} />],
                    [
                      "Environment keys",
                      (project.env || []).map((item) => item.key).join(", ") ||
                        "None configured",
                    ],
                  ]}
                />
              </Panel>
              <Panel
                title="Runtime & infrastructure"
                subtitle="Current deployment configuration"
              >
                <DetailList
                  items={[
                    [
                      "Container",
                      <CopyValue value={project.dockerContainerName} />,
                    ],
                    ["Container ID", <CopyValue value={project.containerId} />],
                    ["Image", project.dockerImage || "—"],
                    ["Network", project.networkName],
                    ["Application port", project.port],
                    ["Assigned port", project.assignedPort || "—"],
                    ["Internal URL", project.internalUrl || "—"],
                    [
                      "Monitoring",
                      project.monitor?.enabled
                        ? "Enabled · " + project.monitor.healthPath
                        : "Disabled",
                    ],
                  ]}
                />
              </Panel>
              <Panel title="Notifications">
                <DetailList
                  items={[
                    [
                      "Email",
                      project.notifications?.email?.enabled
                        ? project.notifications.email.emailAddress
                        : "Disabled",
                    ],
                    [
                      "Discord",
                      project.notifications?.discord?.enabled
                        ? "Enabled"
                        : "Disabled",
                    ],
                    [
                      "Telegram",
                      project.notifications?.telegram?.enabled
                        ? "Enabled"
                        : "Disabled",
                    ],
                  ]}
                />
              </Panel>
            </div>
          )}
          {tab === "configuration" && (
            <Configuration
              key={project.updatedAt || resource.updatedAt?.toISOString()}
              project={project}
              onSaved={resource.reload}
              canWrite={canWrite}
            />
          )}
          {tab === "domains" && (
            <div className="two-columns">
              <Panel title="Domain routing">
                <DetailList
                  items={[
                    ["Subdomain", project.subdomain || "Not configured"],
                    [
                      "Public URL",
                      url ? (
                        <a
                          className="text-link"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {url}
                        </a>
                      ) : (
                        "Not available"
                      ),
                    ],
                    [
                      "Custom domains",
                      (project.customDomains || []).join(", ") ||
                        "None configured",
                    ],
                  ]}
                />
              </Panel>
              <Panel title="SSL certificates">
                <div className="order-list">
                  {data.sslCertificates?.length ? (
                    data.sslCertificates.map((cert) => (
                      <article key={cert._id}>
                        <strong>{cert.domain}</strong>
                        <p>Issued {dateTime(cert.issuedAt)}</p>
                        <small>Expires {dateTime(cert.expiresAt)}</small>
                      </article>
                    ))
                  ) : (
                    <EmptyState title="No SSL certificates" />
                  )}
                </div>
              </Panel>
            </div>
          )}
          {["builds", "deployments"].includes(tab) && (
            <History
              key={tab}
              projectId={projectId}
              type={tab}
              canWrite={canWrite}
            />
          )}
          {tab === "billing" && (
            <div className="two-columns">
              <Orders
                title="Completed orders"
                rows={data.billing?.completedOrders || []}
              />
              <Orders
                title="Pending orders"
                rows={data.billing?.pendingOrders || []}
              />
            </div>
          )}
          {tab === "cache" && (
            <Panel
              title="Routing cache"
              subtitle="Inspect the keys associated with this project."
              actions={
                canWrite && (
                  <ConfirmButton
                    className="btn btn-warn"
                    label="Purge project cache"
                    confirmText={
                      "Remove cached routing data for " +
                      project.name +
                      "? Subsequent requests may need to rebuild it."
                    }
                    onConfirm={() =>
                      action("post", "/purge-cache", "Cache purged")
                    }
                  />
                )
              }
            >
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Entry</th>
                      <th>Exists</th>
                      <th>Type</th>
                      <th>Key / value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.redis || {})
                      .filter(([key]) => key !== "customDomains")
                      .map(([label, entry]) => (
                        <tr key={label}>
                          <td>{titleCase(label)}</td>
                          <td>{entry?.exists ? "Yes" : "No"}</td>
                          <td>{entry?.type || "—"}</td>
                          <td>
                            <CopyValue value={entry?.key} />
                            {entry?.value && (
                              <pre className="inline-code">
                                {typeof entry.value === "string"
                                  ? entry.value
                                  : JSON.stringify(entry.value, null, 2)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
          {tab === "actions" && canWrite && (
            <Panel
              title="Project actions"
              subtitle="Destructive operations require an explicit review."
              className="danger-panel"
            >
              {[
                [
                  "Delete build history",
                  "Removes all build records for this project.",
                  "/builds",
                ],
                [
                  "Delete deployment history",
                  "Removes all deployment records for this project.",
                  "/deployments",
                ],
              ].map(([label, text, suffix]) => (
                <div className="danger-row" key={suffix}>
                  <div>
                    <h3>{label}</h3>
                    <p>{text}</p>
                  </div>
                  <ConfirmButton
                    label={label}
                    match={project.name}
                    confirmText={text + " This cannot be undone."}
                    onConfirm={() =>
                      action("delete", suffix, "Records deleted")
                    }
                  />
                </div>
              ))}
              <div className="danger-row">
                <div>
                  <h3>Delete this project</h3>
                  <p>
                    Queues cleanup across deployments, builds, monitoring, and
                    analytics.
                  </p>
                </div>
                <ConfirmButton
                  label="Delete project"
                  match={project.name}
                  confirmText={
                    "Permanently delete " +
                    project.name +
                    " and queue its resources for cleanup?"
                  }
                  onConfirm={async () => {
                    await api.delete("/projects/" + projectId);
                    toast.success("Project deletion queued");
                    navigate("/projects");
                  }}
                />
              </div>
            </Panel>
          )}
          <DataStamp resource={resource} />
        </>
      )}
    </ResourceState>
  );
}
