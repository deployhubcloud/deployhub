export const runtimes = [
  {
    id: "static",
    name: "Static",
    mark: "▲",
    language: "HTML · CSS · JavaScript",
    description: "A home for your frontend, portfolio, or documentation.",
    detail:
      "Choose your build command and publish directory. We serve the output over HTTPS.",
    kind: "Websites & frontends",
    icon: "globe",
  },
  {
    id: "node",
    name: "Node.js",
    mark: "JS",
    language: "JavaScript · TypeScript",
    description: "Bring your APIs and server-side ideas to life.",
    detail:
      "Set your runtime version, start command, and port. Keep your configuration in environment variables.",
    kind: "APIs & web services",
    icon: "box",
  },
  {
    id: "java",
    name: "Java",
    mark: "J",
    language: "Java",
    description: "Give your Java applications room to run.",
    detail:
      "Choose a compatible Pro plan and configure your build and start commands for your Java service.",
    kind: "Backend applications",
    icon: "box",
  },
  {
    id: "go",
    name: "Go",
    mark: "Go",
    language: "Go",
    description: "Small services. Big possibilities.",
    detail:
      "Connect your repository, configure your Go build, and expose the port your service listens on.",
    kind: "APIs & microservices",
    icon: "box",
  },
  {
    id: "python",
    name: "Python",
    mark: "Py",
    language: "Python",
    description: "From your Python project to a running web service.",
    detail:
      "Choose your Python runtime and configure dependencies, a start command, and your service port.",
    kind: "Web apps & services",
    icon: "box",
  },
];

// Published plan information, aligned with backend/shared/constants/plan.js.
// The authenticated dashboard confirms current prices and plan availability at checkout.
export const plans = [
  {
    id: "free",
    name: "Free",
    description: "A first home for your next idea.",
    price: 0,
    types: ["static"],
    resources: null,
    features: [
      "Static website hosting",
      "DeployHub subdomain",
      "Automatic SSL",
      "Email, Discord & Telegram alerts",
    ],
    customDomain: false,
    cicd: false,
    monitoring: false,
    diagnostics: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "More room for your growing projects.",
    price: 1499,
    types: ["static", "node", "go", "python"],
    resources: "256 MB RAM · 0.5 vCPU · 5 GB storage",
    features: [
      "Everything in Free",
      "Node.js, Go & Python services",
      "Custom domains",
      "GitHub auto-deploy",
    ],
    customDomain: true,
    cicd: true,
    monitoring: false,
    diagnostics: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "A complete toolkit for production.",
    price: 2499,
    types: ["static", "node", "go", "python", "java"],
    resources: "512 MB RAM · 1 vCPU · 10 GB storage",
    features: [
      "Everything in Starter",
      "Java applications",
      "Uptime monitoring",
      "AI diagnostics",
    ],
    customDomain: true,
    cicd: true,
    monitoring: true,
    diagnostics: true,
  },
];
