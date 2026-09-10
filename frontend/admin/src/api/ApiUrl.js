const defaultBaseUrl = import.meta.env.PROD
  ? "https://adminapi.deployhub.cloud"
  : "http://localhost:4010";

export const BaseUrl = (
  import.meta.env.VITE_ADMIN_API_URL || defaultBaseUrl
).replace(/\/$/, "");
