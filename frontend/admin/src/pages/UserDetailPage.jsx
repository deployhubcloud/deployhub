import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Boxes, KeyRound, Pencil, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import useResource from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
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
import { dateTime, message } from "../utils";
function EditUser({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.fullName || "");
  const [status, setStatus] = useState(user.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch("/users/" + user._id, { fullName: name.trim(), status });
      toast.success("User updated");
      onSaved();
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Edit account" onClose={onClose} busy={busy}>
      <form onSubmit={save} className="form-stack">
        <label className="field">
          Full name
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Account status
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspend">Suspended</option>
          </select>
        </label>
        {status === "suspend" && user.status !== "suspend" && (
          <div className="notice warning">
            Suspending this account will also revoke its active sessions.
          </div>
        )}
        <ErrorState error={error} />
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={
              busy ||
              !name.trim() ||
              (name === user.fullName && status === user.status)
            }
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function UserDetailPage() {
  const { userId } = useParams();
  const [params, setParams] = useSearchParams();
  const resource = useResource("/users/" + userId);
  const { can } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const data = resource.data;
  const user = data?.user;
  const canWrite = can("users:write");
  const tabs = [
    "overview",
    "projects",
    "sessions",
    ...(canWrite ? ["actions"] : []),
  ];
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "overview";
  async function run(method, path, success, options) {
    await api[method](path, options);
    toast.success(success);
    resource.reload();
  }
  return (
    <ResourceState resource={resource}>
      {user && (
        <>
          <PageHeader
            eyebrow="USER PROFILE"
            back="/users"
            title={user.fullName || "Unnamed account"}
            subtitle={user.email}
            actions={
              <>
                <RefreshButton resource={resource} />
                {canWrite && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil size={15} />
                    Edit account
                  </button>
                )}
              </>
            }
          />
          <div className="entity-strip">
            <Avatar name={user.fullName || user.email} />
            <CopyValue value={user._id} />
            <StatusBadge value={user.status} />
            <span className="access-note">
              {canWrite ? "Account management" : "Read-only access"}
            </span>
          </div>
          <div className="stats-grid">
            <StatCard label="Projects" value={data.projectCount} icon={Boxes} />
            <StatCard
              label="Active sessions"
              value={data.sessions?.length}
              icon={KeyRound}
            />
            <StatCard
              label="Provider"
              value={user.provider || "—"}
              icon={UserRound}
            />
            <StatCard
              label="Login attempts"
              value={user.loginAttempts ?? 0}
              icon={ShieldCheck}
            />
          </div>
          <Tabs
            items={tabs}
            value={tab}
            onChange={(value) => setParams({ tab: value })}
          />
          {tab === "overview" && (
            <div className="two-columns">
              <Panel
                title="Account details"
                subtitle="Identity and account lifecycle"
              >
                <DetailList
                  items={[
                    ["Full name", user.fullName],
                    ["Email", user.email],
                    ["GitHub", user.githubUsername || "Not connected"],
                    ["GitHub ID", user.githubId || "—"],
                    ["Created", dateTime(user.createdAt)],
                    ["Last updated", dateTime(user.updatedAt)],
                  ]}
                />
              </Panel>
              <Panel
                title="Security & environment"
                subtitle="Current account context"
              >
                <DetailList
                  items={[
                    ["Account status", <StatusBadge value={user.status} />],
                    ["Network", <CopyValue value={user.networkName} />],
                    [
                      "Locked until",
                      user.lockUntil ? dateTime(user.lockUntil) : "Not locked",
                    ],
                    ["Sign-in provider", user.provider],
                    ["Active sessions", data.sessions?.length ?? "—"],
                  ]}
                />
                <div className="panel-note">
                  Review active sessions to investigate access issues. Account
                  changes require user management permission.
                </div>
              </Panel>
            </div>
          )}
          {tab === "projects" && (
            <Panel
              title="Owned projects"
              subtitle={
                data.projectCount == null
                  ? "Project service unavailable"
                  : `Showing ${data.projects?.length || 0} of ${data.projectCount} projects`
              }
              actions={
                can("projects:read") && (
                  <Link className="text-link" to={"/projects?userId=" + userId}>
                    Open project directory
                  </Link>
                )
              }
            >
              {data.availability?.projects === false ? (
                <ErrorState
                  error="Projects could not be loaded."
                  retry={resource.reload}
                />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Runtime</th>
                        <th>Plan</th>
                        <th>Subdomain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects?.length ? (
                        data.projects.map((project) => (
                          <tr key={project._id}>
                            <td>
                              {can("projects:read") ? (
                                <Link
                                  className="text-link"
                                  to={"/projects/" + project._id}
                                >
                                  {project.name}
                                </Link>
                              ) : (
                                project.name
                              )}
                            </td>
                            <td>
                              <StatusBadge value={project.status} />
                            </td>
                            <td>{project.type}</td>
                            <td>
                              <span className="plan-tag">{project.plan}</span>
                            </td>
                            <td>
                              <code>{project.subdomain || "—"}</code>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>
                            <EmptyState title="No projects for this user" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}
          {tab === "sessions" && (
            <Panel
              title="Active sessions"
              subtitle="Devices currently signed in to this account"
              actions={
                canWrite && (
                  <ConfirmButton
                    className="btn btn-warn"
                    label="Revoke all sessions"
                    confirmText={`Sign ${user.email} out on every device? They will need to sign in again.`}
                    onConfirm={() =>
                      run(
                        "post",
                        "/users/" + userId + "/revoke-sessions",
                        "Sessions revoked",
                      )
                    }
                  />
                )
              }
            >
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>IP address</th>
                      <th>Session ID</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions?.length ? (
                      data.sessions.map((session) => (
                        <tr key={session.key}>
                          <td>
                            {session.device ||
                              session.userAgent ||
                              "Unknown device"}
                          </td>
                          <td>
                            <code>{session.ip || "—"}</code>
                          </td>
                          <td>
                            <CopyValue value={session.tokenId} />
                          </td>
                          <td className="nowrap muted">
                            {dateTime(session.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState title="No active sessions" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
          {tab === "actions" && canWrite && (
            <Panel
              title="Account actions"
              subtitle="Review the scope of each action before continuing."
              className="danger-panel"
            >
              <div className="danger-row">
                <div>
                  <h3>Delete all owned projects</h3>
                  <p>
                    Queues cleanup for every project owned by this account. The
                    user account remains.
                  </p>
                </div>
                <ConfirmButton
                  label="Delete user projects"
                  match={user.email}
                  confirmText={`Delete all projects owned by ${user.email}? This cannot be undone.`}
                  onConfirm={() =>
                    run(
                      "delete",
                      "/users/" + userId + "/projects",
                      "Project deletion queued",
                    )
                  }
                />
              </div>
              <div className="danger-row">
                <div>
                  <h3>Delete account and projects</h3>
                  <p>
                    Permanently removes the user and queues cleanup of their
                    projects.
                  </p>
                </div>
                <ConfirmButton
                  label="Delete account"
                  match={user.email}
                  confirmText={`Permanently delete ${user.email} and all of their projects?`}
                  onConfirm={async () => {
                    await api.delete("/users/" + userId, {
                      params: { deleteProjects: true },
                    });
                    toast.success("Account deleted; project cleanup queued");
                    navigate("/users");
                  }}
                />
              </div>
            </Panel>
          )}
          <DataStamp resource={resource} />
          {editing && (
            <EditUser
              user={user}
              onClose={() => setEditing(false)}
              onSaved={resource.reload}
            />
          )}
        </>
      )}
    </ResourceState>
  );
}
