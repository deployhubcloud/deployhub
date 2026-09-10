import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { DashboardLink, Icon, Logo } from "./ui";
import { dashboardUrl } from "../config";
import ThemePicker from "./ThemePicker";

const links = [
  { to: "/", label: "Overview" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/developers", label: "Our team" },
];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="container nav-bar">
        <Link
          className="brand-link"
          to="/"
          aria-label="DeployHub home"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemePicker />
          <a className="sign-in" href={dashboardUrl("/login")}>
            Log in
          </a>
          <DashboardLink className="button primary nav-cta">
            Start building
          </DashboardLink>
          <button
            className="icon-button mobile-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <a href={dashboardUrl("/login")}>Log in</a>
          <DashboardLink>Start building</DashboardLink>
        </nav>
      )}
    </header>
  );
}
