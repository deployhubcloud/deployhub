# DeployHub public website

React + Vite marketing website in `frontend/frontend`. Routes: `/`, `/pricing`, `/about`, and `/developers` (the team page).

Run `npm ci`, then `npm run dev`. Use `npm run lint` and `npm run build` before shipping.

The UI uses the same Manrope/DM Sans fonts, logo, semantic color roles, and ten palettes as Dashboard-Revamp. Slate is the default. Keep `src/theme.js` aligned with `../Dashboard-Revamp/src/theme.js`; the local copy allows this folder to build independently in Docker. Preferences persist under `deployhub.appearance.v1`, sync between tabs on the same origin, and fall back to Slate when storage is unavailable. Separate deployed subdomains keep separate browser preferences.

All project CTAs link to the existing dashboard creation routes. `VITE_DASHBOARD_URL` optionally changes the destination at build time; the default is `https://dashboard.deployhub.cloud`.

Published pricing lives in `src/data.js` and matches `backend/shared/constants/plan.js`. Keep them aligned when plans change. The plans API currently requires authentication, so this public page does not attempt an anonymous request. Final plan selection, duration, and payment remain in the dashboard. The 12-month comparison multiplies the monthly rate by 12; it does not advertise a discount.

Team information and GitHub profile links retain the existing site content. Portraits fall back to initials if images fail to load. Decorative product diagrams describe the deployment flow and do not display simulated deployment statistics.

The existing Docker/Nginx setup builds this folder and serves all client routes through `index.html`. The CI workflow remains `.github/workflows/frontend.yml`.
