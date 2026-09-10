# Admin workspace design

This revision replaces the previous full-height sidebar and uniform card dashboard with global top navigation and workspaces organized around the task at hand. It retains Dashboard-Revamp's ten palettes, with Slate as the default.

## Interaction references

- [Linear display options](https://linear.app/docs/display-options): switch between board/list layouts and change ordering. Here, applications have a status board, current-page sorting and display density.
- [Linear peek previews](https://linear.app/docs/peek): inspect a record while retaining context. Customer and application previews fetch the record from the admin API and keep the directory's current filters and pagination behind the drawer.
- [Linear custom views](https://linear.app/docs/custom-views): make frequently used filters easy to revisit. Saved admin views are explicitly browser-local; they are not team-shared server resources.
- [Vercel observability overview](https://vercel.com/changelog/overview-page-in-observability): move from an aggregate operational picture to detailed investigation. The home combines actual portfolio distribution, attention links, source availability and API audit activity.

These are interaction references. The composition, branding and implementation are specific to DeployHub.

## Page structure

- Global header: workspace identity, command search, appearance and account menu. Horizontal primary navigation replaces the previous sidebar.
- Home: application portfolio, metric ribbon, attention inbox, plan distribution and a separate activity rail. Percentages derive from available project counts. No invented trend lines or historical deltas.
- Users/projects: view rail, filter toolbar, current-page sorting, selection/export, density, pagination and record previews. Project boards explicitly show only the loaded page. Resetting filters retains display preferences.
- Record details: identity and summary above a vertical section index; mobile uses scrollable section navigation.
- Infrastructure: service cards by default, with a table alternative. Logs and inspection open in context; protected controls and confirmations remain API-driven.
- Team: administrator cards next to role guidance, with contextual editing.
- Audit: date-grouped event timeline with a filter rail, a table alternative and inspectable events.
- Login: centered access portal with the existing credentials and OTP steps.

## Verification

ESLint and Vite production build pass. Browser checks cover the existing auth/edit/permission workflows and the new previews, selected CSV contents, saved-view persistence/removal, sorting, density, board switching, mobile navigation, fleet inspection, timeline switching and all ten palettes. Layout checks cover 390, 768 and 1440 pixels.

Browser tests use intercepted API fixtures. Application code contains no fixture fallback; live integration still requires the admin service and downstream infrastructure.
