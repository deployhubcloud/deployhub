const dashboardBase = (
  import.meta.env.VITE_DASHBOARD_URL || "https://dashboard.deployhub.cloud"
).replace(/\/$/, "");
export const dashboardUrl = (path = "/") => `${dashboardBase}${path}`;
