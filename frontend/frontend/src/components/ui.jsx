import { Link } from "react-router-dom";
import { dashboardUrl } from "../config";

export function Icon({ name = "arrow", size = 20, ...props }) {
  const paths = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      </>
    ),
    code: (
      <>
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />
      </>
    ),
    branch: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="5" r="2" />
        <path d="M6 7v10M18 7a10 10 0 0 1-10 10" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10 9-5M3 8l9 5v8M7 5.8l9 5" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    activity: (
      <>
        <path d="M2 12h5l3-8 4 16 3-8h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    palette: (
      <>
        <circle cx="8" cy="9" r=".6" />
        <circle cx="12" cy="6" r=".6" />
        <circle cx="16" cy="9" r=".6" />
        <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-4-5-6-9-6Z" />
      </>
    ),
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m7 9 3 3-3 3m6 0h4" />
      </>
    ),
    spark: (
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.code}
    </svg>
  );
}

export function Logo({ compact = false }) {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="m8 29 12-20 12 20h-9l-3-7-4 7z" fill="currentColor" />
        <circle cx="32" cy="9" r="3" fill="currentColor" />
      </svg>
      {!compact && (
        <span>
          deployhub<span className="accent">.</span>
        </span>
      )}
    </span>
  );
}

export function DashboardLink({
  children = "Start building",
  path = "/projects/new",
  className = "button primary",
}) {
  return (
    <a className={className} href={dashboardUrl(path)}>
      {children}
      <Icon name="arrow" size={17} />
    </a>
  );
}

export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export function ClosingCTA() {
  return (
    <section className="container closing-cta">
      <div>
        <span className="eyebrow">YOUR NEXT IDEA STARTS HERE</span>
        <h2>
          Less setup.
          <br />
          More shipped.
        </h2>
        <p>Give your next project a place to call home.</p>
      </div>
      <div className="closing-actions">
        <DashboardLink>Deploy your first project</DashboardLink>
        <Link className="text-link" to="/pricing">
          Find your plan <Icon size={16} />
        </Link>
      </div>
      <div className="cta-orbit" aria-hidden="true">
        <Logo compact />
      </div>
    </section>
  );
}
