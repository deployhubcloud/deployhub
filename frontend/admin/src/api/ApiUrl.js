const defaultBaseUrl = import.meta.env.PROD
  ? 'https://api.deployhub.cloud/api/v1/admin'
  : 'http://localhost:4999/api/v1/admin'

export const BaseUrl = (import.meta.env.VITE_ADMIN_API_URL || defaultBaseUrl).replace(/\/$/, '')
