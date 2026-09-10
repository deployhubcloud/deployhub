import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Inbox,
  LoaderCircle,
  Palette,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { dateTime, exportCsv, message, number, titleCase } from "../utils";

export function Icon({ name, size = 18 }) {
  const Component =
    { palette: Palette, check: Check, close: X }[name] || ArrowRight;
  return <Component size={size} aria-hidden="true" />;
}
export function Logo() {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="m8 29 12-20 12 20h-9l-3-7-4 7z" fill="currentColor" />
        <circle cx="32" cy="9" r="3" fill="currentColor" />
      </svg>
      <span>
        deployhub<span className="accent">.</span>
      </span>
    </span>
  );
}
export function StatusBadge({ value }) {
  const status = String(value || "unknown").toLowerCase();
  const tone = [
    "running",
    "live",
    "active",
    "success",
    "paid",
    "healthy",
    "completed",
  ].includes(status)
    ? "green"
    : [
          "failed",
          "crash",
          "suspend",
          "suspended",
          "deleted",
          "disabled",
          "unhealthy",
          "dead",
          "missing",
          "error",
        ].includes(status)
      ? "red"
      : [
            "building",
            "deploying",
            "queued",
            "pending",
            "pending_payment",
            "restarting",
            "created",
          ].includes(status)
        ? "amber"
        : "gray";
  return (
    <span className={`badge badge-${tone}`}>
      <i />
      {titleCase(status)}
    </span>
  );
}
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow = "WORKSPACE",
  back,
}) {
  return (
    <header className="page-heading">
      <div>
        {back && (
          <Link className="back-link" to={back}>
            <ArrowLeft size={14} />
            Back to {back.split("/")[1]}
          </Link>
        )}
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </header>
  );
}
export function StatCard({ label, value, hint, onClick, icon: Symbol, tone }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component onClick={onClick} className={`stat-card ${tone || ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        {Symbol && <Symbol size={17} />}
      </div>
      <strong>
        {typeof value === "number" ? number(value) : (value ?? "—")}
      </strong>
      {hint && <small>{hint}</small>}
    </Component>
  );
}
export function EmptyState({ title = "Nothing here yet", text, action }) {
  return (
    <div className="empty-state">
      <span>
        <Inbox size={23} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return error ? (
    <div role="alert" className="error-state">
      <AlertCircle size={18} />
      <div>
        <strong>Couldn’t complete the request</strong>
        <p>{error}</p>
      </div>
      {retry && (
        <button className="btn btn-ghost" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  ) : null;
}
export function ResourceState({ resource, children }) {
  if (!resource.data && resource.loading)
    return (
      <div className="loading-state" role="status">
        <LoaderCircle className="spin" size={22} />
        Loading workspace data…
      </div>
    );
  if (!resource.data && resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  return (
    <>
      <ErrorState error={resource.error} retry={resource.reload} />
      {children}
    </>
  );
}
export function RefreshButton({ resource }) {
  return (
    <button
      className="btn btn-ghost"
      onClick={resource.reload}
      disabled={resource.loading}
    >
      <RefreshCw size={15} className={resource.loading ? "spin" : ""} />
      Refresh
    </button>
  );
}
export function DataStamp({ resource }) {
  return (
    <span className="data-stamp">
      {resource.loading
        ? "Updating…"
        : resource.updatedAt
          ? `Updated ${dateTime(resource.updatedAt)}`
          : "Waiting for data"}
      {resource.data?.cached ? " · Cached snapshot" : ""}
    </span>
  );
}
export function Panel({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
  busy = false,
}) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const node = ref.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmButton({
  className = "btn btn-danger",
  label,
  confirmText,
  onConfirm,
  disabled,
  match,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [typed, setTyped] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onConfirm?.();
      setOpen(false);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => {
          setTyped("");
          setError("");
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open && (
        <Modal title={label} onClose={() => setOpen(false)} busy={busy}>
          <form onSubmit={submit}>
            <div className="action-review">
              <ShieldAlert size={24} />
              <p>
                {confirmText ||
                  `Confirm ${label.toLowerCase()} for this record?`}
              </p>
            </div>
            {match && (
              <label className="field">
                Type <strong>{match}</strong> to confirm
                <input
                  className="input"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
            )}
            <ErrorState error={error} />
            <div className="modal-footer">
              <button
                autoFocus
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={busy || (match && typed !== match)}
              >
                {busy ? "Working…" : label}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  if (!value) return "—";
  return (
    <span className="copy-value">
      <code>{String(value)}</code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy value"}
        className="copy-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            setError("");
          } catch {
            setError("Select and copy the value manually.");
          }
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      {error && <small role="status">{error}</small>}
    </span>
  );
}
export function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs" aria-label="Page sections">
      {items.map((item) => {
        const id = typeof item === "string" ? item : item.id;
        return (
          <button
            key={id}
            className={`tab ${value === id ? "active" : ""}`}
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            {typeof item === "string" ? titleCase(item) : item.label}
          </button>
        );
      })}
    </div>
  );
}
export function Filters({
  fields,
  placeholder = "Search records…",
  searchKey = "q",
  showLabels = false,
}) {
  const [params, setParams] = useSearchParams();
  const displayKeys = ["view", "density", "sort"];
  const hasFilters = [...params.keys()].some(
    (key) => !displayKeys.includes(key) && key !== "page",
  );
  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (String(value).trim()) next.set(key, String(value).trim());
      else next.delete(key);
    }
    next.delete("page");
    setParams(next);
  }
  return (
    <form className="filter-bar" key={params.toString()} onSubmit={submit}>
      <label className="search-input">
        <Search size={16} />
        <input
          name={searchKey}
          aria-label={placeholder}
          placeholder={placeholder}
          defaultValue={params.get(searchKey) || ""}
        />
      </label>
      {fields?.map((field) => (
        <label className="filter-field" key={field.key}>
          <span className={showLabels ? "filter-label" : "sr-only"}>
            {field.label}
          </span>
          {field.type ? (
            <input
              className="input"
              type={field.type}
              name={field.key}
              defaultValue={params.get(field.key) || ""}
              aria-label={field.label}
            />
          ) : (
            <select
              className="select"
              name={field.key}
              defaultValue={params.get(field.key) || ""}
            >
              <option value="">{field.label}</option>
              {field.options.map((option) => (
                <option
                  key={typeof option === "string" ? option : option.value}
                  value={typeof option === "string" ? option : option.value}
                >
                  {typeof option === "string"
                    ? titleCase(option)
                    : option.label}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
      <button className="btn btn-primary">Apply filters</button>
      {hasFilters && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            setParams(
              new URLSearchParams(
                [...params].filter(([key]) => displayKeys.includes(key)),
              ),
            )
          }
        >
          Reset
        </button>
      )}
    </form>
  );
}
export function Pagination({ pagination, count = 0 }) {
  const [params, setParams] = useSearchParams();
  const page = pagination?.page || Number(params.get("page")) || 1;
  const limit = pagination?.limit || 25;
  const total = pagination?.total ?? count;
  const pages = pagination?.pages || Math.max(1, Math.ceil(total / limit));
  function go(next) {
    const query = new URLSearchParams(params);
    query.set("page", String(next));
    setParams(query);
  }
  return (
    <div className="pagination">
      <span>
        {count
          ? `${(page - 1) * limit + 1}–${(page - 1) * limit + count}`
          : "0"}{" "}
        of {number(total)} records
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => go(page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
export function ExportButton({
  filename,
  columns,
  rows,
  label = "Export page",
}) {
  return (
    <button
      className="btn btn-ghost"
      disabled={!rows?.length}
      onClick={() => exportCsv(filename, columns, rows)}
    >
      <ArrowDownToLine size={15} />
      {label}
    </button>
  );
}
export function Avatar({ name }) {
  return (
    <span className="avatar">
      {String(name || "?")
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function DetailList({ items }) {
  return (
    <dl className="detail-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
