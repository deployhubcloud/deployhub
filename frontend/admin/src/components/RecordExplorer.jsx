import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Boxes,
  Check,
  Columns3,
  GitBranch,
  List,
  Plus,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import useResource from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
  CopyValue,
  DataStamp,
  DetailList,
  EmptyState,
  ExportButton,
  Filters,
  Modal,
  PageHeader,
  Pagination,
  RefreshButton,
  ResourceState,
  StatusBadge,
} from "./ui";
import { dateTime, number, shortDate, titleCase } from "../utils";

const configs = {
  users: {
    title: "Users",
    eyebrow: "CUSTOMER OPERATIONS",
    description: "An account directory built for getting things done.",
    singular: "user",
    views: [
      ["", "Everyone"],
      ["active", "Active accounts"],
      ["pending", "Awaiting activation"],
      ["suspend", "Suspended"],
    ],
    search: "Search name, email, or GitHub...",
    columns: [
      { label: "Name", value: (r) => r.fullName },
      { label: "Email", value: (r) => r.email },
      { label: "Status", value: (r) => r.status },
      { label: "Provider", value: (r) => r.provider },
      { label: "Created", value: (r) => r.createdAt },
    ],
  },
  projects: {
    title: "Projects",
    eyebrow: "APPLICATION OPERATIONS",
    description:
      "Move between your portfolio and the work that needs attention.",
    singular: "project",
    views: [
      ["", "All applications"],
      ["running", "Running"],
      ["failed", "Failed"],
      ["crash", "Crashed"],
      ["stopped", "Stopped"],
    ],
    search: "Search project, domain, or repository...",
    columns: [
      { label: "Project", value: (r) => r.name },
      { label: "Runtime", value: (r) => r.type },
      { label: "Status", value: (r) => r.status },
      { label: "Plan", value: (r) => r.plan },
      { label: "Owner ID", value: (r) => r.userId },
    ],
  },
};
function RecordPeek({ type, id, onClose }) {
  const resource = useResource("/" + type + "/" + id);
  const project = type === "projects";
  const data = resource.data;
  const record = project ? data?.project : data?.user;
  return (
    <Modal
      title={project ? "Application preview" : "Customer preview"}
      className="detail-drawer record-peek"
      onClose={onClose}
    >
      <ResourceState resource={resource}>
        {record && (
          <>
            <div className="peek-identity">
              <Avatar name={record.fullName || record.name || record.email} />
              <h2>{record.fullName || record.name || "Unnamed account"}</h2>
              <p>{project ? record.subdomain : record.email}</p>
              <StatusBadge value={record.status} />
            </div>
            <div className="peek-metrics">
              <div>
                <strong>
                  {number(project ? data.counts?.builds : data.projectCount)}
                </strong>
                <span>{project ? "Builds" : "Projects"}</span>
              </div>
              <div>
                <strong>
                  {number(
                    project ? data.counts?.deployments : data.sessions?.length,
                  )}
                </strong>
                <span>{project ? "Deployments" : "Sessions"}</span>
              </div>
            </div>
            <DetailList
              items={
                project
                  ? [
                      ["Runtime", titleCase(record.type)],
                      ["Plan", titleCase(record.plan)],
                      ["Branch", record.branch],
                      ["Owner", data.owner?.email || record.userId],
                      ["Created", dateTime(record.createdAt)],
                      ["Project ID", <CopyValue value={record._id} />],
                    ]
                  : [
                      ["Provider", record.provider],
                      ["GitHub", record.githubUsername || "Not connected"],
                      ["Created", dateTime(record.createdAt)],
                      ["Network", record.networkName],
                      ["User ID", <CopyValue value={record._id} />],
                    ]
              }
            />
            <div className="peek-next">
              <h3>Continue in the workspace</h3>
              <p>
                {project
                  ? "Inspect delivery history, domains and configuration."
                  : "Review sessions, owned projects and account controls."}
              </p>
              <Link
                className="btn btn-primary full-width"
                to={"/" + type + "/" + id}
              >
                Open full workspace <ArrowUpRight size={16} />
              </Link>
            </div>
          </>
        )}
      </ResourceState>
    </Modal>
  );
}
function SaveView({ onClose, onSave }) {
  const [name, setName] = useState("");
  return (
    <Modal title="Save this view" onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name.trim());
        }}
      >
        <p className="muted">
          Save these filters and display settings in this browser.
        </p>
        <label className="field">
          View name
          <input
            autoFocus
            className="input"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!name.trim()}>
            Save view
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function RecordExplorer({ type }) {
  const config = configs[type],
    project = type === "projects";
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(
    (project ? ["q", "status", "plan", "type", "userId"] : ["q", "status"]).map(
      (key) => [key, params.get(key) || ""],
    ),
  );
  const resource = useResource("/" + type, {
    ...query,
    page: Math.max(1, Number(params.get("page")) || 1),
    limit: 25,
  });
  const [selected, setSelected] = useState([]);
  const [peek, setPeek] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewError, setViewError] = useState("");
  const storageKey = "deployhub.admin.views." + type;
  const [saved, setSaved] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed)
        ? parsed.filter(
            (v) => typeof v.name === "string" && typeof v.query === "string",
          )
        : [];
    } catch {
      return [];
    }
  });
  const sort = params.get("sort") || "default";
  const rows = [...(resource.data?.[type] || [])].sort((a, b) =>
    sort === "name"
      ? (a.fullName || a.name || "").localeCompare(b.fullName || b.name || "")
      : sort === "newest"
        ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        : 0,
  );
  const chosen = rows.filter((row) => selected.includes(row._id));
  const board = project && params.get("view") === "board";
  const compact = params.get("density") === "compact";
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  function selectView(status) {
    const next = new URLSearchParams(params);
    if (status) next.set("status", status);
    else next.delete("status");
    next.delete("page");
    setParams(next);
    setSelected([]);
  }
  function toggle(id) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }
  function storeViews(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(next);
      setViewError("");
      return true;
    } catch {
      setViewError("Views could not be saved. Browser storage is unavailable.");
      return false;
    }
  }
  const groups = [
    ["running", "Running", (r) => r.status === "running"],
    [
      "progress",
      "In progress",
      (r) => ["queued", "building", "deploying"].includes(r.status),
    ],
    [
      "attention",
      "Needs attention",
      (r) => ["failed", "crash"].includes(r.status),
    ],
    [
      "other",
      "Other",
      (r) =>
        ![
          "running",
          "queued",
          "building",
          "deploying",
          "failed",
          "crash",
        ].includes(r.status),
    ],
  ];
  return (
    <>
      <PageHeader
        title={config.title}
        eyebrow={config.eyebrow}
        subtitle={config.description}
        actions={
          <>
            <RefreshButton resource={resource} />
            <button className="btn btn-primary" onClick={() => setSaving(true)}>
              <Bookmark size={15} />
              Save view
            </button>
          </>
        }
      />
      <div className="explorer-layout">
        <aside className="view-sidebar">
          <div className="view-sidebar-heading">
            WORKSPACE VIEWS <SlidersHorizontal size={13} />
          </div>
          {config.views.map(([value, label]) => (
            <button
              key={value}
              className={
                (query.status === value ? "selected " : "") + "view-link"
              }
              onClick={() => selectView(value)}
            >
              {project ? <Boxes size={15} /> : <Users size={15} />}
              <span>{label}</span>
              {query.status === value && <span className="view-indicator" />}
            </button>
          ))}
          <div className="view-sidebar-heading saved-heading">
            SAVED VIEWS
            <button
              aria-label="Save current view"
              onClick={() => setSaving(true)}
            >
              <Plus size={14} />
            </button>
          </div>
          {saved.map((view, i) => (
            <div className="saved-view" key={view.name + i}>
              <button
                onClick={() => {
                  setParams(new URLSearchParams(view.query));
                  setSelected([]);
                }}
              >
                <Bookmark size={14} />
                {view.name}
              </button>
              <button
                aria-label={"Remove view " + view.name}
                onClick={() =>
                  storeViews(saved.filter((_, index) => index !== i))
                }
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {!saved.length && (
            <p className="view-help">
              Keep the filters you use most, one click away.
            </p>
          )}
          {viewError && (
            <p role="alert" className="view-help">
              {viewError}
            </p>
          )}
          <div className="view-context">
            <span className="workspace-mark">
              {project ? <Boxes size={18} /> : <Users size={18} />}
            </span>
            <strong>{number(resource.data?.pagination?.total)}</strong>
            <span>matching {project ? "applications" : "accounts"}</span>
            <p>
              {can(type + ":write")
                ? "You have management access."
                : "Your access is read-only."}
            </p>
          </div>
        </aside>
        <section
          className={"explorer-content" + (compact ? " is-compact" : "")}
        >
          <div className="explorer-heading">
            <div>
              <span className="eyebrow">
                {project ? "APPLICATION PORTFOLIO" : "CUSTOMER DIRECTORY"}
              </span>
              <h2>
                {config.views.find(([value]) => value === query.status)?.[1] ||
                  titleCase(query.status)}{" "}
                <span>{number(resource.data?.pagination?.total)}</span>
              </h2>
            </div>
            <div className="explorer-display">
              {project && (
                <div className="display-toggle" aria-label="Project display">
                  <button
                    aria-label="List view"
                    aria-pressed={!board}
                    onClick={() => update("view", "")}
                  >
                    <List size={16} />
                  </button>
                  <button
                    aria-label="Board view"
                    aria-pressed={board}
                    onClick={() => update("view", "board")}
                  >
                    <Columns3 size={16} />
                  </button>
                </div>
              )}
              <button
                className="btn btn-ghost"
                aria-pressed={compact}
                onClick={() => update("density", compact ? "" : "compact")}
              >
                <SlidersHorizontal size={14} />
                {compact ? "Compact" : "Comfortable"}
              </button>
            </div>
          </div>
          {query.userId && (
            <Link className="owner-context" to={"/users/" + query.userId}>
              Filtered to customer {query.userId}
              <ArrowUpRight size={13} />
            </Link>
          )}
          <Filters
            placeholder={config.search}
            fields={
              project
                ? [
                    {
                      key: "status",
                      label: "All statuses",
                      options: [
                        "draft",
                        "queued",
                        "building",
                        "deploying",
                        "running",
                        "failed",
                        "stopped",
                        "crash",
                      ],
                    },
                    {
                      key: "type",
                      label: "All runtimes",
                      options: ["static", "node", "java", "go", "python"],
                    },
                    {
                      key: "plan",
                      label: "All plans",
                      options: ["free", "starter", "pro"],
                    },
                  ]
                : []
            }
          />
          <div className="result-toolbar">
            <span>
              {chosen.length
                ? chosen.length + " selected on this page"
                : board
                  ? "Board shows the current page"
                  : "Select records or open a quick preview"}
            </span>
            <div>
              {chosen.length > 0 && (
                <button className="text-link" onClick={() => setSelected([])}>
                  Clear selection
                </button>
              )}
              <label>
                Sort page
                <select
                  value={sort}
                  onChange={(e) => update("sort", e.target.value)}
                  aria-label="Sort current page"
                >
                  <option value="default">Service order</option>
                  <option value="name">Name A–Z</option>
                  <option value="newest">Newest first</option>
                </select>
              </label>
              <ExportButton
                label={chosen.length ? "Export selected" : "Export page"}
                filename={"deployhub-" + type + ".csv"}
                rows={chosen.length ? chosen : rows}
                columns={config.columns}
              />
            </div>
          </div>
          <ResourceState resource={resource}>
            {board ? (
              <div className="project-board">
                {groups.map(([key, label, match]) => (
                  <section className="board-column" key={key}>
                    <header>
                      <i className={"board-dot " + key} />
                      <strong>{label}</strong>
                      <span>{rows.filter(match).length}</span>
                    </header>
                    {rows.filter(match).map((record) => (
                      <article className="application-card" key={record._id}>
                        <div>
                          <span className="runtime-symbol">
                            {record.type === "node"
                              ? "N"
                              : record.type === "python"
                                ? "Py"
                                : record.type === "static"
                                  ? "</>"
                                  : record.type?.slice(0, 2) || "App"}
                          </span>
                          <input
                            type="checkbox"
                            aria-label={"Select " + record.name}
                            checked={selected.includes(record._id)}
                            onChange={() => toggle(record._id)}
                          />
                        </div>
                        <button
                          className="application-name"
                          onClick={() => setPeek(record._id)}
                        >
                          {record.name}
                          <ArrowUpRight size={14} />
                        </button>
                        <p>
                          <GitBranch size={12} />
                          {record.branch || "No branch"}
                        </p>
                        <StatusBadge value={record.status} />
                        <footer>
                          <span>{record.plan}</span>
                          <span>{shortDate(record.createdAt)}</span>
                        </footer>
                      </article>
                    ))}
                    {!rows.some(match) && (
                      <div className="board-empty">
                        <Check size={15} />
                        <span>No applications in this group</span>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table explorer-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Select all on this page"
                          disabled={!rows.length}
                          checked={
                            Boolean(rows.length) &&
                            chosen.length === rows.length
                          }
                          onChange={() =>
                            setSelected(
                              chosen.length === rows.length
                                ? []
                                : rows.map((row) => row._id),
                            )
                          }
                        />
                      </th>
                      <th>{project ? "Application" : "Customer"}</th>
                      <th>Status</th>
                      <th>{project ? "Runtime / plan" : "Provider"}</th>
                      <th>{project ? "Owner" : "Network"}</th>
                      <th>Created</th>
                      <th>
                        <span className="sr-only">Workspace</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length ? (
                      rows.map((record) => (
                        <tr
                          key={record._id}
                          className={
                            selected.includes(record._id) ? "row-selected" : ""
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={
                                "Select " +
                                (record.fullName || record.name || record.email)
                              }
                              checked={selected.includes(record._id)}
                              onChange={() => toggle(record._id)}
                            />
                          </td>
                          <td>
                            <button
                              className="record-identity peek-trigger"
                              aria-label={
                                "Preview " +
                                (record.fullName || record.name || record.email)
                              }
                              onClick={() => setPeek(record._id)}
                            >
                              {project ? (
                                <span className="runtime-symbol">
                                  {record.type === "node"
                                    ? "N"
                                    : record.type === "static"
                                      ? "</>"
                                      : record.type?.slice(0, 2) || "App"}
                                </span>
                              ) : (
                                <Avatar
                                  name={record.fullName || record.email}
                                />
                              )}
                              <span>
                                <strong>
                                  {record.fullName ||
                                    record.name ||
                                    "Unnamed account"}
                                </strong>
                                <small>
                                  {project ? (
                                    <>
                                      <GitBranch size={11} />
                                      {record.branch ||
                                        record.subdomain ||
                                        record._id}
                                    </>
                                  ) : (
                                    record.email
                                  )}
                                </small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <StatusBadge value={record.status} />
                          </td>
                          <td>
                            {project ? (
                              <>
                                <span className="capitalize">
                                  {record.type}
                                </span>
                                <small className="cell-subtitle">
                                  {titleCase(record.plan)}
                                </small>
                              </>
                            ) : (
                              <span className="provider-tag">
                                {record.provider || "—"}
                              </span>
                            )}
                          </td>
                          <td>
                            {project ? (
                              <Link
                                className="text-link mono"
                                to={"/users/" + record.userId}
                              >
                                {String(record.userId).slice(-8)}
                              </Link>
                            ) : (
                              <code className="muted">
                                {record.networkName || "—"}
                              </code>
                            )}
                          </td>
                          <td className="muted nowrap">
                            {shortDate(record.createdAt)}
                          </td>
                          <td>
                            <Link
                              className="icon-button subtle"
                              aria-label={
                                "View " +
                                (record.fullName || record.name || record.email)
                              }
                              to={"/" + type + "/" + record._id}
                            >
                              <ArrowUpRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            title={"No " + type + " match these filters"}
                            text="Try a different search or clear your filters."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              pagination={resource.data?.pagination}
              count={rows.length}
            />
          </ResourceState>
          <div className="explorer-bottom">
            <DataStamp resource={resource} />
            <span>
              <ArrowRight size={12} /> Click a name to preview without leaving
              this view
            </span>
          </div>
        </section>
      </div>
      {peek && (
        <RecordPeek
          key={peek}
          type={type}
          id={peek}
          onClose={() => setPeek(null)}
        />
      )}
      {saving && (
        <SaveView
          onClose={() => setSaving(false)}
          onSave={(name) => {
            const next = [...saved, { name, query: params.toString() }];
            if (storeViews(next)) setSaving(false);
          }}
        />
      )}
    </>
  );
}
