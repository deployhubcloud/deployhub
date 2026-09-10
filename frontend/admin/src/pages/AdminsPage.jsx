import { useState } from "react";
import { Plus, ShieldCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import useResource from "../hooks/useResource";
import {
  Avatar,
  ConfirmButton,
  DataStamp,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Panel,
  RefreshButton,
  ResourceState,
  StatCard,
  StatusBadge,
} from "../components/ui";
import { dateTime, message } from "../utils";
function AdminForm({ account, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: account?.username || "",
    email: account?.email || "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (account)
        await api.patch("/admins/" + account.id, {
          email: form.email,
          ...(form.password ? { password: form.password } : {}),
        });
      else await api.post("/admins", form);
      toast.success(account ? "Admin updated" : "Admin created");
      onSaved();
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={account ? "Edit administrator" : "Add administrator"}
      onClose={onClose}
      busy={busy}
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="notice">
          <ShieldCheck size={18} />
          <span>
            Support administrators can view users. Infrastructure, projects, and
            access management stay restricted to super administrators.
          </span>
        </div>
        <label className="field">
          Username
          <input
            className="input"
            value={form.username}
            disabled={Boolean(account)}
            minLength={3}
            required
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="field">
          Email address
          <input
            className="input"
            type="email"
            value={form.email}
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="field">
          {account ? "New password (optional)" : "Initial password"}
          <input
            className="input"
            type="password"
            value={form.password}
            minLength={8}
            required={!account}
            autoComplete="new-password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <p className="field-hint">
          A verification code is sent to this email at sign-in.
        </p>
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
          <button className="btn btn-primary" disabled={busy}>
            {busy
              ? "Saving…"
              : account
                ? "Save administrator"
                : "Create administrator"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function AdminsPage() {
  const resource = useResource("/admins");
  const [editor, setEditor] = useState(null);
  const [query, setQuery] = useState("");
  const all = resource.data?.admins || [];
  const rows = all.filter((account) =>
    (account.username + " " + account.email)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  async function toggle(account) {
    const status = account.status === "active" ? "disabled" : "active";
    await api.patch("/admins/" + account.id, { status });
    toast.success("Administrator " + status);
    resource.reload();
  }
  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Access & team"
        subtitle="Give the right people the access they need."
        actions={
          <>
            <RefreshButton resource={resource} />
            <button className="btn btn-primary" onClick={() => setEditor({})}>
              <Plus size={16} />
              Add administrator
            </button>
          </>
        }
      />
      <ResourceState resource={resource}>
        <div className="stats-grid three">
          <StatCard
            label="Support administrators"
            value={all.length}
            icon={Users}
          />
          <StatCard
            label="Active accounts"
            value={all.filter((a) => a.status === "active").length}
            icon={ShieldCheck}
          />
          <StatCard
            label="Disabled accounts"
            value={all.filter((a) => a.status === "disabled").length}
          />
        </div>
        <div className="team-workspace">
          <aside className="team-policy">
            <ShieldCheck size={25} />
            <h2>
              The right access.
              <br />
              For the right people.
            </h2>
            <p>
              Manage the people supporting your customers, with clear boundaries
              for every account.
            </p>
            <ul>
              <li>
                <strong>Support administrators</strong>Read-only access to
                customer records.
              </li>
              <li>
                <strong>Super administrators</strong>Full platform management.
              </li>
              <li>
                <strong>Account protection</strong>Email verification at
                sign-in.
              </li>
            </ul>
          </aside>
          <Panel
            title="Team directory"
            subtitle="Super administrator credentials are managed in the server configuration."
          >
            <div className="filter-bar">
              <input
                className="input"
                aria-label="Search administrators"
                placeholder="Find by username or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="team-cards">
              {rows.length ? (
                rows.map((account) => (
                  <article className="team-card" key={account.id}>
                    <div className="team-card-top">
                      <Avatar name={account.username} />
                      <StatusBadge value={account.status} />
                    </div>
                    <h3>{account.username}</h3>
                    <p>{account.email}</p>
                    <small>
                      Support administrator · Added{" "}
                      {dateTime(account.createdAt)}
                    </small>
                    <div className="row-actions">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setEditor(account)}
                      >
                        Edit
                      </button>
                      <ConfirmButton
                        className="btn btn-ghost"
                        label={
                          account.status === "active" ? "Disable" : "Enable"
                        }
                        confirmText={
                          (account.status === "active"
                            ? "Disable access for "
                            : "Restore access for ") +
                          account.username +
                          "?"
                        }
                        onConfirm={() => toggle(account)}
                      />
                      <ConfirmButton
                        label="Remove"
                        confirmText={
                          "Permanently remove administrator " +
                          account.username +
                          "?"
                        }
                        match={account.username}
                        onConfirm={async () => {
                          await api.delete("/admins/" + account.id);
                          toast.success("Administrator removed");
                          resource.reload();
                        }}
                      />
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title={
                    query
                      ? "No matching administrators"
                      : "Your admin team starts here"
                  }
                  text="Add an administrator to give them read-only user access."
                />
              )}
            </div>
          </Panel>
        </div>
        <div className="notice access-summary">
          <ShieldCheck size={20} />
          <span>
            Roles are enforced by the API. Creating an administrator does not
            grant super administrator access.
          </span>
        </div>
      </ResourceState>
      <DataStamp resource={resource} />
      {editor && (
        <AdminForm
          account={editor.id ? editor : null}
          onClose={() => setEditor(null)}
          onSaved={resource.reload}
        />
      )}
    </>
  );
}
