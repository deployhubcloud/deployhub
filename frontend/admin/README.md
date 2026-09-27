# DeployHub administration

React + Vite admin workspace using the same Light and Dark themes as Dashboard-Revamp. Dark is the default; the selected theme persists in local storage for the current origin. Saved legacy themes migrate to Light or Dark. Every record, metric and operation uses the admin API. There is no demo-data fallback.

## Run

```sh
npm ci
npm run dev
npm run lint
npm run build
```

`VITE_ADMIN_API_URL` optionally overrides the API origin. Defaults are `http://localhost:4010` in development and `https://adminapi.deployhub.cloud` in production. It must be provided at build time, including as a Docker build argument when using the container. Never put credentials in Vite variables.

The API must allow the frontend origin with credentialed CORS. Sign-in uses the existing username/password and email OTP flow, followed by a cookie session. Backend configuration and infrastructure requirements remain in the admin service.

## Workspace

The admin now uses global top navigation, contextual record previews, saved directory views, a project status board, vertical detail sections, a service-card fleet and an audit timeline. See [design notes](DESIGN.md) for layout decisions and interaction references.

- Overview: live service statistics, availability indicators and filtered attention links.
- Users and projects: URL-based filters, pagination, current-page CSV export and detailed workspaces.
- User profile: identity, owned projects, active sessions and reviewed account actions.
- Project workspace: configuration review, domains, paginated build/deployment history, billing and routing-cache inspection.
- Infrastructure: searchable fleet, optional eight-second refresh while visible, resource history, events, host information and filterable/downloadable logs.
- Access and activity: support-admin management and filterable audit events with detail drawers.
- Command search: Ctrl/Cmd+K searches permitted pages, users and projects.

Support admins retain read-only user access and password management. Super admins have the existing full permissions. Backend authorization remains authoritative. Protected containers follow the API's control capabilities. Account/project deletion and critical service operations require typed confirmation.

## API changes in this revision

- `GET /projects/:projectId/builds` and `/deployments` proxy paginated history; limits are capped at 100 and invalid pagination returns 400.
- `fresh=1` bypasses cached overview, user and project reads. Complete snapshots cache for 30 seconds. Failed downstream metrics are unavailable, rather than zero, and partial snapshots are not cached.
- Audit filters accept actor, literal action text, success/failed outcome, date range and pagination. Date-only end dates include the entire UTC day.
- Super-admin mutations join support activity in the audit log. Infrastructure operations retain their existing dedicated audit events.
- Account deletion stops if queuing project cleanup fails, preventing identity deletion in that failure case.

## Verification

Run `npm test` in `backend/services/admin-service` for isolated regression tests. They stub Redis and downstream services and do not modify infrastructure.

The redesign was browser-checked at 390, 768 and 1440 pixel widths with intercepted API fixtures: routing, search, filters, pagination, editing, confirmation cancellation, log inspection, themes, permissions, password updates and OTP return navigation. Live integration requires the running admin API and its downstream services; fixture checks do not establish live connectivity.
