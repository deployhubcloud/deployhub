import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import useResource from "../hooks/useResource";
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
} from "../components/ui";
import { dateTime, titleCase } from "../utils";
export default function AuditLogsPage() {
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("timeline");
  const query = Object.fromEntries(
    ["actor", "action", "from", "to", "outcome"].map((key) => [
      key,
      params.get(key) || "",
    ]),
  );
  const resource = useResource("/audit-logs", {
    ...query,
    page: Math.max(1, Number(params.get("page")) || 1),
    limit: 25,
  });
  const rows = resource.data?.logs || [];
  const target =
    selected?.targetId && ["user", "project"].includes(selected.targetType)
      ? "/" + selected.targetType + "s/" + selected.targetId
      : null;
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Activity log"
        subtitle="Investigate account access and administrative changes."
        actions={
          <>
            <ExportButton
              filename="deployhub-audit-page.csv"
              rows={rows}
              columns={[
                { label: "Time", value: (r) => r.createdAt },
                { label: "Actor", value: (r) => r.actorUsername },
                { label: "Action", value: (r) => r.action },
                { label: "HTTP status", value: (r) => r.statusCode },
                { label: "Target", value: (r) => r.targetId },
                { label: "IP", value: (r) => r.ip },
              ]}
            />
            <RefreshButton resource={resource} />
          </>
        }
      />
      <div className="audit-workspace">
        <aside className="audit-filters">
          <span className="eyebrow">REFINE ACTIVITY</span>
          <h2>Follow the trail.</h2>
          <p>Filter by administrator, action, outcome, or date.</p>
          <Filters
            showLabels
            searchKey="action"
            placeholder="Search action or request path…"
            fields={[
              { key: "actor", label: "Actor username", type: "text" },
              { key: "from", label: "From date", type: "date" },
              { key: "to", label: "To date", type: "date" },
              {
                key: "outcome",
                label: "All outcomes",
                options: [
                  { value: "success", label: "Successful" },
                  { value: "failed", label: "Failed" },
                ],
              },
            ]}
          />
        </aside>
        <section className="card audit-results">
          <div className="explorer-heading">
            <div>
              <span className="eyebrow">WORKSPACE HISTORY</span>
              <h2>
                Event stream{" "}
                <span>{resource.data?.pagination?.total ?? "—"}</span>
              </h2>
            </div>
            <div className="display-toggle">
              <button
                aria-pressed={view === "timeline"}
                onClick={() => setView("timeline")}
              >
                Timeline
              </button>
              <button
                aria-pressed={view === "table"}
                onClick={() => setView("table")}
              >
                Table
              </button>
            </div>
          </div>
          <ResourceState resource={resource}>
            {view === "timeline" ? (
              <div className="audit-timeline">
                {rows.length ? (
                  rows.map((log, i) => (
                    <div key={log._id}>
                      {(i === 0 ||
                        new Date(log.createdAt).toDateString() !==
                          new Date(rows[i - 1].createdAt).toDateString()) && (
                        <div className="audit-day">
                          {new Date(log.createdAt).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      )}
                      <button
                        className="audit-event"
                        aria-label={"Inspect event " + log._id}
                        onClick={() => setSelected(log)}
                      >
                        <span className="audit-event-time">
                          {new Date(log.createdAt).toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                        <Avatar name={log.actorUsername} />
                        <span className="audit-event-body">
                          <strong>
                            {log.actorUsername}
                            <small>{titleCase(log.actorRole)}</small>
                          </strong>
                          <span>
                            <i className="method-tag">
                              {log.method || "EVENT"}
                            </i>
                            <code>{log.path || log.action}</code>
                          </span>
                          <small>
                            {log.targetType
                              ? titleCase(log.targetType) +
                                " · " +
                                String(log.targetId || "").slice(-8)
                              : "Workspace activity"}
                          </small>
                        </span>
                        <StatusBadge
                          value={
                            log.statusCode >= 400
                              ? "failed"
                              : log.statusCode >= 200
                                ? "success"
                                : "pending"
                          }
                        />
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No events match these filters"
                    text="Try another date range or clear the filters."
                  />
                )}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Administrator</th>
                      <th>Outcome</th>
                      <th>Target</th>
                      <th>Time</th>
                      <th>
                        <span className="sr-only">Inspect</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length ? (
                      rows.map((log) => (
                        <tr key={log._id}>
                          <td>
                            <button
                              className="table-link"
                              onClick={() => setSelected(log)}
                            >
                              <span className="method-tag">
                                {log.method || "EVENT"}
                              </span>
                              <span>{log.path || log.action}</span>
                            </button>
                          </td>
                          <td>
                            <div className="record-identity">
                              <Avatar name={log.actorUsername} />
                              <span>
                                <strong>{log.actorUsername}</strong>
                                <small>{titleCase(log.actorRole)}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge
                              value={
                                log.statusCode >= 400
                                  ? "failed"
                                  : log.statusCode >= 200
                                    ? "success"
                                    : "pending"
                              }
                            />
                            <small className="cell-subtitle">
                              HTTP {log.statusCode ?? "—"}
                            </small>
                          </td>
                          <td className="muted">
                            {log.targetType
                              ? titleCase(log.targetType) +
                                " · " +
                                String(log.targetId || "").slice(-8)
                              : "Workspace"}
                          </td>
                          <td className="muted nowrap">
                            {dateTime(log.createdAt)}
                          </td>
                          <td>
                            <button
                              className="icon-button subtle"
                              aria-label={"Inspect event " + log._id}
                              onClick={() => setSelected(log)}
                            >
                              <ArrowUpRight size={17} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                            title="No events match these filters"
                            text="Try another date range or clear the filters."
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
        </section>
      </div>
      <DataStamp resource={resource} />
      {selected && (
        <Modal
          title="Event details"
          onClose={() => setSelected(null)}
          className="detail-drawer"
        >
          <div className="drawer-summary">
            <StatusBadge
              value={selected.statusCode >= 400 ? "failed" : "success"}
            />
            <code>
              {selected.method} {selected.path}
            </code>
          </div>
          <DetailList
            items={[
              ["Event ID", <CopyValue value={selected._id} />],
              ["Administrator", selected.actorUsername],
              ["Role", titleCase(selected.actorRole)],
              ["Timestamp", dateTime(selected.createdAt)],
              ["HTTP status", selected.statusCode],
              [
                "Target",
                selected.targetId ? (
                  <CopyValue value={selected.targetId} />
                ) : (
                  "Workspace"
                ),
              ],
              ["IP address", selected.ip || "—"],
              [
                "Duration",
                selected.meta?.durationMs != null
                  ? selected.meta.durationMs + " ms"
                  : "—",
              ],
              ["User agent", selected.userAgent || "—"],
            ]}
          />
          {target && (
            <div className="modal-footer">
              <Link
                className="btn btn-primary"
                to={target}
                onClick={() => setSelected(null)}
              >
                Open {selected.targetType}
                <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
