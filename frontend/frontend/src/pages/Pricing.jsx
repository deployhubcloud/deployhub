import { useState } from "react";
import { ClosingCTA, Icon, SectionHeading } from "../components/ui";
import PlanCard from "../components/PlanCard";
import FaqItem from "../components/FaqItem";
import { plans, runtimes } from "../data";

const rows = [
  [
    "Supported runtimes",
    (plan) =>
      plan.types
        .map((type) => runtimes.find((runtime) => runtime.id === type).name)
        .join(", "),
  ],
  ["DeployHub subdomain & SSL", () => true],
  ["Custom domains", (plan) => plan.customDomain],
  ["GitHub auto-deploy", (plan) => plan.cicd],
  ["Uptime monitoring", (plan) => plan.monitoring],
  ["AI diagnostics", (plan) => plan.diagnostics],
  ["Email, Discord & Telegram alerts", () => true],
  ["Container resources", (plan) => plan.resources || "Static hosting"],
];
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <section className="container page-hero centered">
        <span className="eyebrow">ROOM FOR WHAT COMES NEXT</span>
        <h1>
          Start small.
          <br />
          <span>Build something big.</span>
        </h1>
        <p>
          Simple plans for each project. Start with a static site, then choose
          the resources and tools your next idea needs.
        </p>
      </section>
      <section className="container pricing-section">
        <div className="pricing-toolbar">
          <span>
            <Icon name="box" size={17} /> One plan per project
          </span>
          <div className="segmented-control" aria-label="Pricing period">
            <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
              Monthly
            </button>
            <button aria-pressed={annual} onClick={() => setAnnual(true)}>
              12 months
            </button>
          </div>
          <span>Prices in INR</span>
        </div>
        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>
        <p className="pricing-note">
          Published plan rates. Review current pricing and the total in your
          dashboard before payment. The 12-month view uses the monthly rate ×
          12.
        </p>
      </section>
      <section className="container section">
        <SectionHeading
          eyebrow="THE DETAILS, ALL TOGETHER"
          title="Find your fit."
        />
        <div
          className="comparison-wrap"
          role="region"
          aria-label="Plan comparison"
          tabIndex={0}
        >
          <table className="comparison-table">
            <caption className="sr-only">DeployHub plan features</caption>
            <thead>
              <tr>
                <th scope="col">Included with your project</th>
                {plans.map((plan) => (
                  <th scope="col" key={plan.id}>
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {plans.map((plan) => (
                    <td key={plan.id}>
                      {typeof value(plan) === "boolean" ? (
                        value(plan) ? (
                          <span className="included">
                            <Icon name="check" size={17} />
                            <span className="sr-only">Included</span>
                          </span>
                        ) : (
                          <span aria-label="Not included">—</span>
                        )
                      ) : (
                        value(plan)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="container faq-section section">
        <SectionHeading
          eyebrow="GOOD QUESTIONS"
          title="A few things to know."
          description="A little clarity before your first deployment."
        />
        <div className="faq-list">
          {[
            [
              "How does per-project pricing work?",
              "Each project has its own plan. Free is for static websites. Starter and Pro add backend runtimes and extra features, with the price applied to each project separately.",
            ],
            [
              "Can I use my own domain?",
              "Custom domains are included with Starter and Pro. Free projects use a DeployHub subdomain. SSL is included on every plan.",
            ],
            [
              "Which runtimes can I deploy?",
              "Static hosting is available on all plans. Starter also supports Node.js, Go, and Python. Pro adds Java alongside the other runtimes.",
            ],
            [
              "How do I choose a plan?",
              "Start a project in the dashboard, choose a runtime, and review the compatible plans. You can review your configuration and the payment total before creating a paid project.",
            ],
            [
              "What does the 12-month view show?",
              "It shows twelve months at the published monthly rate. It does not include an annual discount. Your dashboard shows the available duration and final amount before payment.",
            ],
          ].map(([q, a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>
      <ClosingCTA />
    </>
  );
}
