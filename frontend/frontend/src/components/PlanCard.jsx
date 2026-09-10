import { useState } from "react";
import { DashboardLink, Icon } from "./ui";
import { runtimes } from "../data";

export default function PlanCard({ plan, annual }) {
  const [expanded, setExpanded] = useState(false);
  const isPro = plan.id === "pro";
  return (
    <article className={`plan-card ${isPro ? "featured-plan" : ""}`}>
      <div className="plan-title">
        <span className="plan-symbol">
          <Icon name={isPro ? "spark" : plan.id === "free" ? "code" : "box"} />
        </span>
        {isPro && <span className="small-tag">Production toolkit</span>}
      </div>
      <h2>{plan.name}</h2>
      <p>{plan.description}</p>
      <div className="plan-price">
        <strong>
          {plan.price === 0
            ? "Free"
            : new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(plan.price * (annual ? 12 : 1))}
        </strong>
        {plan.price > 0 && <span> / {annual ? "12 months" : "month"}</span>}
      </div>
      <span className="plan-price-note">
        {plan.price === 0
          ? "For your static projects"
          : annual
            ? "12 months at the monthly rate"
            : "Per project, billed monthly"}
      </span>
      {plan.id === "free" ? (
        <DashboardLink
          className="button secondary full-width"
          path="/projects/new/static"
        >
          Start free
        </DashboardLink>
      ) : (
        <button
          className={`button ${isPro ? "primary" : "secondary"} full-width`}
          aria-expanded={expanded}
          aria-controls={`runtimes-${plan.id}`}
          onClick={() => setExpanded(!expanded)}
        >
          Explore {plan.name}
          <Icon name={expanded ? "close" : "arrow"} size={16} />
        </button>
      )}
      {expanded && (
        <div className="plan-runtimes" id={`runtimes-${plan.id}`}>
          <span className="eyebrow">CHOOSE YOUR RUNTIME</span>
          {runtimes
            .filter((runtime) => plan.types.includes(runtime.id))
            .map((runtime) => (
              <DashboardLink
                key={runtime.id}
                className="text-link"
                path={`/projects/new/${runtime.id}`}
              >
                {runtime.name}
              </DashboardLink>
            ))}
          <small>Select {plan.name} in the dashboard to continue.</small>
        </div>
      )}
      <div className="plan-divider" />
      <span className="eyebrow">WHAT’S INCLUDED</span>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>
            <Icon name="check" size={16} />
            {feature}
          </li>
        ))}
      </ul>
      <div className="plan-resources">
        <Icon name={plan.resources ? "box" : "globe"} size={16} />
        <span>{plan.resources || "Static hosting with SSL"}</span>
      </div>
    </article>
  );
}
