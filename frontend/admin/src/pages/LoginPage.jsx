import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ErrorState, Logo } from "../components/ui";
import ThemePicker from "../components/ThemePicker";
import { message } from "../utils";
export default function LoginPage() {
  const { login, verifyOtp, admin, loading } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const from = location.state?.from;
  const destination =
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !from.startsWith("/login")
      ? from
      : "/";
  if (loading) return <div className="session-loading">Checking session…</div>;
  if (admin) return <Navigate to={destination} replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "credentials") {
        const result = await login(username.trim(), password);
        setLoginId(result.loginId);
        setPassword("");
        setStep("otp");
      } else await verifyOtp(loginId, otp);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow">DEPLOYHUB ADMINISTRATION</span>
          <h2>
            A clear view.
            <br />A confident next move.
          </h2>
          <p>
            Your platform’s people, projects, and infrastructure. One workspace
            to keep it all moving.
          </p>
          <div className="auth-feature">
            <Boxes size={20} />
            <span>Platform-wide visibility</span>
          </div>
          <div className="auth-feature">
            <ShieldCheck size={20} />
            <span>Access scoped to your role</span>
          </div>
          <div className="auth-feature">
            <KeyRound size={20} />
            <span>Email verification at sign-in</span>
          </div>
        </div>
        <small>Built for the people behind the platform.</small>
      </div>
      <div className="auth-main">
        <div className="auth-theme">
          <ThemePicker />
        </div>
        <div className="auth-form">
          <span className="auth-icon">
            <ShieldCheck size={27} />
          </span>
          <span className="eyebrow">ADMIN WORKSPACE</span>
          <h1>
            {step === "credentials" ? "Welcome back." : "Check your inbox."}
          </h1>
          <p>
            {step === "credentials"
              ? "Sign in to your administrator account. We’ll send a verification code to your registered email."
              : "Enter the six-digit code sent to your registered email. The code expires after 10 minutes."}
          </p>
          <div className="auth-steps">
            <span className={step === "credentials" ? "active" : "complete"}>
              01 · Credentials
            </span>
            <i />
            <span className={step === "otp" ? "active" : ""}>
              02 · Verification
            </span>
          </div>
          <form onSubmit={submit} className="form-stack">
            {step === "credentials" ? (
              <>
                <label className="field">
                  Username
                  <input
                    autoFocus
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="field">
                  Password
                  <span className="password-input">
                    <input
                      className="input"
                      type={visible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="copy-button"
                      aria-label={visible ? "Hide password" : "Show password"}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
              </>
            ) : (
              <label className="field">
                Verification code
                <input
                  autoFocus
                  className="input otp-input"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </label>
            )}
            <ErrorState error={error} />
            <button className="btn btn-primary full-width" disabled={busy}>
              {busy
                ? "Please wait…"
                : step === "credentials"
                  ? "Send verification code"
                  : "Enter workspace"}
              <ArrowRight size={16} />
            </button>
            {step === "otp" && (
              <button
                type="button"
                className="btn btn-ghost full-width"
                disabled={busy}
                onClick={() => {
                  setStep("credentials");
                  setOtp("");
                  setError("");
                }}
              >
                <ArrowLeft size={15} />
                Use another account
              </button>
            )}
          </form>
          <p className="auth-footnote">
            <ShieldCheck size={14} />
            For authorized DeployHub administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
