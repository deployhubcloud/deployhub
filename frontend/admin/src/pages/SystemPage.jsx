import { useState } from "react";
import {
  Activity,
  Boxes,
  Download,
  HardDrive,
  ScrollText,
  Search,
  Server,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import useResource from "../hooks/useResource";
import { api } from "../api/client";
import {
  ConfirmButton,
  CopyValue,
  DataStamp,
  DetailList,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Panel,
  RefreshButton,
  ResourceState,
  StatCard,
  StatusBadge,
  Tabs,
} from "../components/ui";
import { bytes, dateTime } from "../utils";
function Sparkline({ values, label }) {
  const points = (values || []).filter((value) => Number.isFinite(value));
  if (points.length < 2)
    return <span className="muted">Collecting samples</span>;
  const max = Math.max(...points, 1);
  const path = points
    .map(
      (point, index) =>
        (index ? "L" : "M") +
        (index / (points.length - 1)) * 240 +
        "," +
        (48 - (point / max) * 42),
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 240 52"
      className="sparkline"
      role="img"
      aria-label={label}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function Usage({ value }) {
  if (value == null || !Number.isFinite(value))
    return <span className="muted">Unavailable</span>;
  return (
    <div className="usage">
      <span>{value.toFixed(1)}%</span>
      <div className="progress-track">
        <i style={{ width: Math.max(0, Math.min(100, value)) + "%" }} />
      </div>
    </div>
  );
}
function UnitLogs({ unit, onClose }) {
  const resource = useResource("/system/" + unit.id + "/logs", { tail: 400 });
  const [filter, setFilter] = useState("");
  const text = resource.data?.text || "";
  const filtered = filter
    ? text
        .split("\n")
        .filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
        .join("\n")
    : text;
  function download() {
    const url = URL.createObjectURL(
      new Blob([filtered], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = unit.id + ".log";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Modal
      title={unit.label + " · logs"}
      className="log-dialog"
      onClose={onClose}
    >
      <div className="log-toolbar">
        <label className="search-input">
          <Search size={15} />
          <input
            aria-label="Filter log lines"
            placeholder="Filter log lines…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <RefreshButton resource={resource} />
        <button
          className="btn btn-ghost"
          disabled={!filtered}
          onClick={download}
        >
          <Download size={15} />
          Download
        </button>
      </div>
      <ErrorState error={resource.error} retry={resource.reload} />
      <pre className="log-output" tabIndex={0}>
        {resource.loading
          ? "Loading container logs…"
          : filtered || "No matching log output."}
      </pre>
      <div className="panel-note">Latest 400 lines · {unit.name}</div>
    </Modal>
  );
}
export default function SystemPage() {
  const [live, setLive] = useState(true);
  const [fleetView, setFleetView] = useState("map");
  const [tab, setTab] = useState("fleet");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState(null);
  const [detail, setDetail] = useState(null);
  const resource = useResource("/system", {}, { interval: live ? 8000 : 0 });
  const data = resource.data;
  const units = (data?.units || []).filter(
    (unit) =>
      (unit.label + " " + unit.name)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!group || unit.group === group) &&
      (!status ||
        (status === "attention"
          ? !unit.running || unit.probe?.ok === false
          : unit.status === status)),
  );
  async function act(unit, action) {
    await api.post("/system/" + unit.id + "/" + action);
    toast.success(
      unit.label +
        " " +
        { start: "started", stop: "stopped", restart: "restarted" }[action],
    );
    resource.reload();
  }
  function actions(unit) {
    return (
      <div className="row-actions">
        {unit.present && (
          <button className="btn btn-ghost" onClick={() => setLogs(unit)}>
            <ScrollText size={14} />
            Logs
          </button>
        )}
        {["start", "restart", "stop"]
          .filter(
            (action) => unit["can" + action[0].toUpperCase() + action.slice(1)],
          )
          .map((action) => (
            <ConfirmButton
              key={action}
              label={action[0].toUpperCase() + action.slice(1)}
              className={action === "stop" ? "btn btn-danger" : "btn btn-ghost"}
              match={unit.critical ? unit.label : undefined}
              confirmText={
                action[0].toUpperCase() +
                action.slice(1) +
                " " +
                unit.label +
                "? " +
                (unit.critical
                  ? "This is a critical service. The operation may interrupt platform traffic."
                  : "This changes the running state of this container.")
              }
              onConfirm={() => act(unit, action)}
            />
          ))}
      </div>
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Infrastructure"
        subtitle="Inspect service health, resource usage, and container activity."
        actions={
          <>
            <label className="live-toggle">
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
              />
              <span className={live ? "live-dot" : ""} />
              Auto-refresh · 8s
            </label>
            <RefreshButton resource={resource} />
          </>
        }
      />
      <ResourceState resource={resource}>
        {data && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Running services"
                value={data.summary?.running}
                hint={(data.summary?.total ?? "—") + " managed units"}
                icon={Server}
                onClick={() => {
                  setStatus("running");
                  setTab("fleet");
                }}
              />
              <StatCard
                label="Needs attention"
                value={
                  data.summary
                    ? new Set(
                        (data.units || [])
                          .filter(
                            (unit) => !unit.running || unit.probe?.ok === false,
                          )
                          .map((unit) => unit.id),
                      ).size
                    : null
                }
                hint="Stopped, missing, or unhealthy"
                icon={Activity}
                tone="warning"
                onClick={() => {
                  setStatus("attention");
                  setTab("fleet");
                }}
              />
              <StatCard
                label="Host CPUs"
                value={data.host?.cpus}
                hint={
                  data.host?.dockerVersion
                    ? "Docker " + data.host.dockerVersion
                    : "Host configuration"
                }
                icon={Boxes}
              />
              <StatCard
                label="Host memory"
                value={bytes(data.host?.memory)}
                hint={data.host?.os || "Docker host"}
                icon={HardDrive}
              />
            </div>
            <Tabs
              items={[
                { id: "fleet", label: "Service fleet" },
                { id: "metrics", label: "Resource history" },
                { id: "events", label: "Container events" },
                { id: "host", label: "Host details" },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === "fleet" && (
              <Panel
                title="Service fleet"
                className="fleet-panel"
                actions={
                  <div className="display-toggle">
                    <button
                      aria-pressed={fleetView === "map"}
                      onClick={() => setFleetView("map")}
                    >
                      Map
                    </button>
                    <button
                      aria-pressed={fleetView === "table"}
                      onClick={() => setFleetView("table")}
                    >
                      Table
                    </button>
                  </div>
                }
                subtitle={units.length + " services in this view"}
              >
                <div className="filter-bar">
                  <label className="search-input">
                    <Search size={16} />
                    <input
                      aria-label="Search services"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find a service…"
                    />
                  </label>
                  <select
                    className="select"
                    aria-label="Service group"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    <option value="">All groups</option>
                    <option value="edge">Edge</option>
                    <option value="backend">Backend</option>
                    <option value="frontend">Frontend</option>
                  </select>
                  <select
                    className="select"
                    aria-label="Service state"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All states</option>
                    <option value="running">Running</option>
                    <option value="attention">Needs attention</option>
                    <option value="exited">Stopped</option>
                    <option value="missing">Missing</option>
                  </select>
                </div>
                {fleetView === "map" ? (
                  <div className="fleet-map">
                    {units.map((unit) => (
                      <article className="fleet-node" key={unit.id}>
                        <div className="fleet-node-heading">
                          <button onClick={() => setDetail(unit)}>
                            <Server size={18} />
                            {unit.label}
                          </button>
                          {unit.critical && (
                            <ShieldCheck
                              size={15}
                              aria-label="Critical service"
                            />
                          )}
                        </div>
                        <p>
                          {unit.group} / {unit.name}
                        </p>
                        <div className="fleet-node-status">
                          <StatusBadge value={unit.status} />
                          <span>
                            {unit.locked
                              ? "Protected"
                              : unit.probe
                                ? (unit.probe.ok ? "Healthy" : "Unhealthy") +
                                  " · " +
                                  unit.probe.ms +
                                  " ms"
                                : "No health probe"}
                          </span>
                        </div>
                        <div className="fleet-node-metrics">
                          <div>
                            <span>CPU usage</span>
                            <Usage value={unit.usage?.cpuPercent} />
                          </div>
                          <div>
                            <span>Memory usage</span>
                            <Usage value={unit.usage?.memory?.percent} />
                          </div>
                        </div>
                        {actions(unit)}
                      </article>
                    ))}
                    {!units.length && (
                      <EmptyState title="No services match these filters" />
                    )}
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table fleet-table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Status</th>
                          <th>Health probe</th>
                          <th>CPU</th>
                          <th>Memory</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.length ? (
                          units.map((unit) => (
                            <tr key={unit.id}>
                              <td>
                                <button
                                  className="table-link"
                                  onClick={() => setDetail(unit)}
                                >
                                  <span className="runtime-avatar">
                                    <Server size={18} />
                                  </span>
                                  <span>
                                    <strong>{unit.label}</strong>
                                    <small>
                                      {unit.group} · {unit.name}
                                    </small>
                                  </span>
                                </button>
                                {unit.critical && (
                                  <span className="cell-subtitle">
                                    Critical service
                                  </span>
                                )}
                              </td>
                              <td>
                                <StatusBadge value={unit.status} />
                                {unit.locked && (
                                  <small className="cell-subtitle">
                                    Protected
                                  </small>
                                )}
                              </td>
                              <td>
                                {unit.probe ? (
                                  <>
                                    <StatusBadge
                                      value={
                                        unit.probe.ok ? "healthy" : "unhealthy"
                                      }
                                    />
                                    <small className="cell-subtitle">
                                      {unit.probe.ms} ms · HTTP{" "}
                                      {unit.probe.status || "—"}
                                    </small>
                                  </>
                                ) : (
                                  <span className="muted">No probe</span>
                                )}
                              </td>
                              <td>
                                <Usage value={unit.usage?.cpuPercent} />
                              </td>
                              <td>
                                <Usage value={unit.usage?.memory?.percent} />
                                <small className="cell-subtitle">
                                  {bytes(unit.usage?.memory?.used)}
                                </small>
                              </td>
                              <td>{actions(unit)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6}>
                              <EmptyState title="No services match these filters" />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            )}
            {tab === "metrics" && (
              <>
                <div className="section-caption">
                  <h2>Recent resource history</h2>
                  <p>
                    Samples collected by the infrastructure monitor. Missing
                    samples are not estimated.
                  </p>
                </div>
                <div className="metric-grid">
                  {(data.units || [])
                    .filter((unit) => unit.history?.length > 1)
                    .map((unit) => (
                      <Panel
                        key={unit.id}
                        title={unit.label}
                        subtitle={unit.history.length + " samples"}
                      >
                        <div className="metric-charts">
                          <div>
                            <span>
                              CPU · {unit.usage?.cpuPercent?.toFixed(1) ?? "—"}%
                            </span>
                            <Sparkline
                              values={unit.history.map(
                                (sample) => sample.cpuPercent,
                              )}
                              label={unit.label + " CPU history"}
                            />
                          </div>
                          <div>
                            <span>
                              Memory ·{" "}
                              {unit.usage?.memory?.percent?.toFixed(1) ?? "—"}%
                            </span>
                            <Sparkline
                              values={unit.history.map(
                                (sample) => sample.memPercent,
                              )}
                              label={unit.label + " memory history"}
                            />
                          </div>
                        </div>
                      </Panel>
                    ))}
                </div>
                {!(data.units || []).some(
                  (unit) => unit.history?.length > 1,
                ) && (
                  <EmptyState
                    title="Waiting for resource samples"
                    text="History appears after the infrastructure monitor collects enough readings."
                  />
                )}
              </>
            )}
            {tab === "events" && (
              <Panel title="Recent container events">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Service</th>
                        <th>Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.events?.length ? (
                        data.events.map((event, index) => (
                          <tr key={event.ts + "-" + index}>
                            <td className="muted nowrap">
                              {dateTime(event.ts)}
                            </td>
                            <td>
                              <strong>{event.label}</strong>
                              <small className="cell-subtitle">
                                {event.name}
                              </small>
                            </td>
                            <td>
                              <StatusBadge value={event.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3}>
                            <EmptyState title="No recent container events" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
            {tab === "host" && (
              <div className="two-columns">
                <Panel title="Docker host">
                  <DetailList
                    items={[
                      ["Operating system", data.host?.os],
                      ["CPU cores", data.host?.cpus],
                      ["Memory", bytes(data.host?.memory)],
                      ["Docker version", data.host?.dockerVersion],
                      ["Image storage", bytes(data.disk?.layersSize)],
                    ]}
                  />
                </Panel>
                <Panel
                  title="Host-managed processes"
                  subtitle="These run outside Docker and cannot be controlled here."
                >
                  <div className="host-processes">
                    {(data.excluded || []).map((item) => (
                      <div key={item.id}>
                        <ShieldCheck size={19} />
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </>
        )}
      </ResourceState>
      <DataStamp resource={resource} />
      {logs && (
        <UnitLogs key={logs.id} unit={logs} onClose={() => setLogs(null)} />
      )}
      {detail && (
        <Modal
          title={detail.label}
          className="detail-drawer"
          onClose={() => setDetail(null)}
        >
          <div className="drawer-summary">
            <StatusBadge value={detail.status} />
            <p>{detail.description}</p>
          </div>
          <DetailList
            items={[
              ["Container name", <CopyValue value={detail.name} />],
              ["Image", detail.image],
              ["Group", detail.group],
              ["Started", dateTime(detail.startedAt)],
              ["Restart count", detail.restartCount],
              ["Ports", detail.ports?.join(", ") || "—"],
              ["Protected", detail.locked ? "Yes" : "No"],
              ["Critical", detail.critical ? "Yes" : "No"],
            ]}
          />
          <div className="modal-footer">
            <button
              className="btn btn-primary"
              disabled={!detail.present}
              onClick={() => {
                setLogs(detail);
                setDetail(null);
              }}
            >
              Inspect logs
              <ScrollText size={15} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
