# Galactic Spacefarer

A SAP CAP (Node.js, TypeScript) service for managing galactic spacefarers: CRUD with role-based access and a rule that users only see and manage spacefarers from their own planet. Built for the SAP BTP Full Stack technical assessment (`SAP BTP Full Stack technical assessment 08.08.2026. - Galactic Spacefarer.pdf`).

## Run it

Requires Node.js 22 and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm start      # http://localhost:4004, in-memory SQLite seeded from db/data
pnpm test       # integration tests against the running service
pnpm lint       # ESLint with the CAP and typescript-eslint rules
```

## Open the UI

With the app running, open <http://localhost:4004/galactic.spacefarers/index.html> and log in with one of the users below (for example `alice` / `alice`). The UI5 libraries load from the SAPUI5 CDN, so an internet connection is needed the first time.

- **List Report:** spacefarers with position, department, stardust (colored by level), a navigation skill bar and suit color. Search, filter (name, position, department, suit color, stardust), sort by any column and page through the results. The default sort is stardust, highest first.
- **Object Page:** click a row for the details, with the stardust and skill in the header and the data grouped into Identity and Cosmic Profile.
- Each user only sees spacefarers from their own planet, so `alice` (Earth) and `bob` (Mars) see different lists.

## Try the API

Open [`test/http/SpacefarerService.http`](test/http/SpacefarerService.http) in VS Code with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension and send the requests from top to bottom. It walks through reading, creating, updating and deleting, then the security rules and validation, and each request states the status it should return. Data lives in memory, so restart the app to reset it.

Mocked development users (defined in `package.json`, only active in the `development` profile):

| User  | Password | Role      | Planet |
|-------|----------|-----------|--------|
| alice | alice    | Commander | EARTH  |
| bob   | bob      | Commander | MARS   |
| carol | carol    | Cadet     | EARTH  |
| dave  | dave     | none      | EARTH  |

## Welcome emails

Creating a spacefarer sends a congratulation email with [nodemailer](https://nodemailer.com).

- **Default (no setup):** the app creates a free [Ethereal](https://ethereal.email) test inbox on the first email and logs a `previewUrl` in the console. Open it to read the message.
- **Real SMTP:** copy `.env.example` to `.env` (gitignored), fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`, then restart. The email goes to the spacefarer's address.

A failed email is logged and does not fail the request. Tests run against an in-process fake SMTP server, so they need no network.

## What is implemented

| Area | Where | Notes |
|------|-------|-------|
| Data model | `db/schema.cds` | `Spacefarers` with stardust, wormhole navigation skill, suit color, origin planet and position. `Planets`, `Departments` and `Positions` are lookup entities. Department is derived from the position. |
| Service | `srv/spacefarer-service.cds` | CRUD on `Spacefarers`, read-only lookups. The service requires the `Cadet` or `Commander` role. Only Commanders can write. |
| Planet isolation | `srv/spacefarer-service.cds`, `srv/spacefarer-service.ts` | A `@restrict` condition limits reads and changes to the user's own planet. A `before` handler rejects writes that target another planet, because the condition only checks existing rows. |
| Fiori UI | `app/spacefarers/` | Generated with SAP Fiori tools (List Report and Object Page), served by the CAP server through `cds-plugin-ui5`. The screens are driven by the UI annotations in `app/spacefarers/annotations.cds`, with no custom UI code. |
| Create handlers | `srv/spacefarer-service.ts`, `srv/mailer.ts` | `before CREATE` rejects negative stardust and a skill outside 1 to 10, and adds a welcome bonus of 100 stardust. `after CREATE` sends the welcome email. |
| Validation | `db/schema.cds`, `srv/spacefarer-constraints.cds` | Suit color enum, email format, mandatory origin planet, existing position. |
| Tests | `test/spacefarer-service.test.ts` | Vitest with `cds.test`, covering authentication, roles, planet isolation, CRUD, validation, the create handlers and the welcome email. |

## Project layout

```
app/       Fiori Elements app and its UI annotations
db/        data model and seed data (CSV)
srv/       service definition, handlers and mailer
test/      automated tests and the .http walkthrough
```

## Notes

- Authentication is mocked for local development. On SAP BTP the roles and the `planet` attribute would come from XSUAA or IAS, and the database would be SAP HANA Cloud. The service code stays the same.
- Local TypeScript support: `pnpm start` runs `cds-tsx serve`, which loads the `.ts` handlers through `tsx`.
