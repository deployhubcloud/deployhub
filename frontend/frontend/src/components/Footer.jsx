import { Link } from "react-router-dom";
import { DashboardLink, Icon, Logo } from "./ui";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Link to="/" aria-label="DeployHub home">
            <Logo />
          </Link>
          <p>
            A home for what you build.
            <br />
            From your first commit to what comes next.
          </p>
        </div>
        <div className="footer-links">
          <span className="eyebrow">EXPLORE</span>
          <Link to="/">Overview</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/about">About DeployHub</Link>
          <Link to="/developers">Meet the team</Link>
        </div>
        <div className="footer-links">
          <span className="eyebrow">BUILD WITH DEPLOYHUB</span>
          <DashboardLink className="text-link" path="/projects/new/static">
            Static websites
          </DashboardLink>
          <DashboardLink className="text-link" path="/projects/new/node">
            Backend services
          </DashboardLink>
          <DashboardLink className="text-link" path="/">
            Open dashboard
          </DashboardLink>
        </div>
        <div className="footer-note">
          <Icon name="code" size={25} />
          <p>
            Made for the way
            <br />
            you build.
          </p>
          <Link to="/developers" className="text-link">
            Meet the makers <Icon size={15} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} DeployHub. All rights reserved.
        </span>
        <span>Built with intention. Shipped with DeployHub.</span>
      </div>
    </footer>
  );
}
