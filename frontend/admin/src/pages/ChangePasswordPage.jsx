import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ErrorState, PageHeader, Panel } from "../components/ui";
import { message } from "../utils";
export default function ChangePasswordPage() {
  const { isSuper } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (form.newPassword !== form.confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api.patch("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Account security"
        subtitle="Manage the password you use to access this workspace."
      />
      <div className="settings-layout">
        <Panel
          title="Password"
          subtitle="Email verification still applies each time you sign in."
        >
          {isSuper ? (
            <div className="panel-body">
              <div className="notice">
                <ShieldCheck size={20} />
                The super administrator credentials are managed through the
                platform’s server configuration.
              </div>
            </div>
          ) : (
            <form className="form-stack panel-body" onSubmit={submit}>
              {[
                ["currentPassword", "Current password"],
                ["newPassword", "New password"],
                ["confirmPassword", "Confirm new password"],
              ].map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <input
                    className="input"
                    type="password"
                    value={form[key]}
                    autoComplete={
                      key === "currentPassword"
                        ? "current-password"
                        : "new-password"
                    }
                    minLength={key === "currentPassword" ? undefined : 8}
                    required
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
              <p className="field-hint">
                Use at least eight characters for your new password.
              </p>
              <ErrorState error={error} />
              {saved && (
                <div className="notice success" role="status">
                  Your password has been updated.
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-primary" disabled={busy}>
                  <KeyRound size={15} />
                  {busy ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          )}
        </Panel>
        <div className="settings-help">
          <ShieldCheck size={24} />
          <h3>Your account, protected.</h3>
          <p>
            Use a unique password. Your registered email is used to verify each
            login.
          </p>
        </div>
      </div>
    </>
  );
}
