import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Boxes,
  Command,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Server,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Avatar, EmptyState, ErrorState, Logo, Modal } from "../components/ui";
import ThemePicker from "../components/ThemePicker";
import { message } from "../utils";
const navigation = [
  {
    to: "/",
    label: "Overview",
    icon: LayoutDashboard,
    permission: "dashboard:read",
    group: "WORKSPACE",
  },
  {
    to: "/users",
    label: "Users",
    icon: Users,
    permission: "users:read",
    group: "WORKSPACE",
  },
  {
    to: "/projects",
    label: "Projects",
    icon: Boxes,
    permission: "projects:read",
    group: "WORKSPACE",
  },
  {
    to: "/system",
    label: "Infrastructure",
    icon: Server,
    permission: "system:manage",
    group: "OPERATIONS",
  },
  {
    to: "/audit-logs",
    label: "Activity log",
    icon: Activity,
    permission: "audit:read",
    group: "OPERATIONS",
  },
  {
    to: "/admins",
    label: "Access & team",
    icon: UserCog,
    permission: "admins:manage",
    group: "ADMINISTRATION",
  },
];
function CommandSearch({ onClose, links }) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const sources = [
        ["users", "users:read"],
        ["projects", "projects:read"],
      ].filter(([, permission]) => can(permission));
      const responses = await Promise.allSettled(
        sources.map(async ([type]) => {
          const { data } = await api.get("/" + type, {
            params: { q: query.trim(), limit: 5 },
            signal: controller.signal,
          });
          return (data[type] || []).map((item) => ({
            to: "/" + type + "/" + item._id,
            label: item.fullName || item.name || item.email,
            description: item.email || item.subdomain || item._id,
            type,
          }));
        }),
      );
      if (!controller.signal.aborted) {
        setResults(
          responses.flatMap((result) =>
            result.status === "fulfilled" ? result.value : [],
          ),
        );
        setError(
          responses.some((result) => result.status === "rejected")
            ? "Some search results are unavailable. Try again."
            : "",
        );
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, can]);
  const pages = links.filter((link) =>
    link.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal
      title="Find anything in your workspace"
      className="search-dialog"
      onClose={onClose}
    >
      <label className="command-input">
        <Search size={20} />
        <input
          autoFocus
          placeholder="Search users, projects, or pages…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setResults([]);
            setError("");
            setLoading(event.target.value.trim().length >= 2);
          }}
          aria-label="Search workspace"
        />
      </label>
      <ErrorState error={error} />
      <div className="command-results">
        <span className="eyebrow">PAGES</span>
        {pages.map((link) => (
          <button
            key={link.to}
            onClick={() => {
              navigate(link.to);
              onClose();
            }}
          >
            <link.icon size={17} />
            <span>{link.label}</span>
            <ArrowRight size={15} />
          </button>
        ))}
        {query.trim().length >= 2 && (
          <>
            <span className="eyebrow">RECORDS {loading && "· SEARCHING…"}</span>
            {results.map((result) => (
              <button
                key={result.to}
                onClick={() => {
                  navigate(result.to);
                  onClose();
                }}
              >
                <Avatar name={result.label} />
                <span>
                  {result.label}
                  <small>{result.description}</small>
                </span>
                <span className="result-type">{result.type}</span>
              </button>
            ))}
            {!loading && !results.length && (
              <EmptyState
                title="No matching records"
                text="Try a name, email, or repository."
              />
            )}
          </>
        )}
      </div>
      <div className="command-footer">
        <kbd>esc</kbd> to close
        <span>Results respect your admin permissions</span>
      </div>
    </Modal>
  );
}
export default function AdminLayout() {
  const { admin, logout, can, isSuper } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const links = navigation.filter((link) => can(link.permission));
  const current = links.find((link) =>
    link.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(link.to),
  );
  const detail = /^\/(users|projects)\/[^/]+/.test(location.pathname);
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch((value) => !value);
      }
      if (event.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  async function signOut() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <div className="console-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="console-header">
        <div className="console-identity">
          <Link to="/" aria-label="DeployHub admin home">
            <Logo />
          </Link>
          <span className="identity-divider">/</span>
          <span className="workspace-mark">
            <ShieldCheck size={15} />
          </span>
          <strong>Platform</strong>
          <span className="console-tier">ADMIN</span>
        </div>
        <div className="console-tools">
          <button
            className="console-search"
            onClick={() => setSearch(true)}
            aria-label="Open workspace search"
          >
            <Search size={16} />
            <span>Jump to anything...</span>
            <kbd>
              <Command size={11} /> K
            </kbd>
          </button>
          <ThemePicker />
          <details className="account-menu">
            <summary aria-label="Open account menu">
              <Avatar name={admin.username || admin.adminId} />
            </summary>
            <div className="account-popover">
              <strong>{admin.username || admin.adminId}</strong>
              <small>{admin.email}</small>
              <span className="access-note">
                {isSuper ? "Super administrator" : "Support administrator"}
              </span>
              {!isSuper && (
                <Link to="/password">
                  <KeyRound size={15} /> Account security
                </Link>
              )}
              <a
                href="https://dashboard.deployhub.cloud"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={15} /> Customer dashboard
              </a>
              <button onClick={signOut} disabled={loggingOut}>
                <LogOut size={15} />
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </details>
          <button
            className="icon-button console-menu"
            aria-label="Open navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>
      <div className="console-nav-row">
        <nav
          className={mobile ? "console-nav is-open" : "console-nav"}
          aria-label="Admin navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMobile(false)}
            >
              <link.icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
          {!isSuper && (
            <NavLink to="/password" onClick={() => setMobile(false)}>
              <KeyRound size={16} />
              Security
            </NavLink>
          )}
        </nav>
        <span className="workspace-scope">
          <ShieldCheck size={13} />{" "}
          {isSuper ? "Platform controls" : "Support workspace"}
        </span>
      </div>
      <main
        id="main-content"
        className={
          "console-main" +
          (detail ? " entity-workspace" : "") +
          (location.pathname === "/" ? " is-overview" : "")
        }
        tabIndex={-1}
      >
        <div className="console-location">
          <span>Workspace</span>
          <span>/</span>
          <Link to={current?.to || "/password"}>
            {current?.label || "Account security"}
          </Link>
          {detail && (
            <>
              <span>/</span>
              <span>Workspace details</span>
            </>
          )}
          <span className="location-right">DeployHub console</span>
        </div>
        <Outlet />
      </main>
      <footer className="console-footer">
        <span>
          <ShieldCheck size={12} /> DeployHub administration
        </span>
        <span>Workspace access is scoped to your role</span>
        <button onClick={() => setSearch(true)}>
          Quick navigation <kbd>⌘ K</kbd>
        </button>
      </footer>
      {search && (
        <CommandSearch onClose={() => setSearch(false)} links={links} />
      )}
    </div>
  );
}
