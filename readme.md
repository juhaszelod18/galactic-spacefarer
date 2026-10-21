# Galactic Spacefarer

A SAP CAP (Node.js, TypeScript) service for managing galactic spacefarers: CRUD with role-based access and a rule that users only see and manage spacefarers from their own planet. Built for the SAP BTP Full Stack technical assessment (`SAP BTP Full Stack technical assessment 08.08.2026. - Galactic Spacefarer.pdf`).

## Run it

Requires Node.js 22 and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm start      # http://localhost:4004, in-memory SQLite seeded from db/data
pnpm test       # integration tests against the running service
```

## Try the API

Open [`test/http/SpacefarerService.http`](test/http/SpacefarerService.http) in VS Code with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension and send the requests from top to bottom. It walks through reading, creating, updating and deleting, then the security rules and validation, and each request states the status it should return. Data lives in memory, so restart the app to reset it.

Mocked development users (defined in `package.json`, only active in the `development` profile):

| User  | Password | Role      | Planet |
|-------|----------|-----------|--------|
| alice | alice    | Commander | EARTH  |
| bob   | bob      | Commander | MARS   |
| carol | carol    | Cadet     | EARTH  |
| dave  | dave     | none      | EARTH  |

## What is implemented

| Area | Where | Notes |
|------|-------|-------|
| Data model | `db/schema.cds` | `Spacefarers` with stardust, wormhole navigation skill, suit color, origin planet and position. `Planets`, `Departments` and `Positions` are lookup entities. Department is derived from the position. |
| Service | `srv/spacefarer-service.cds` | CRUD on `Spacefarers`, read-only lookups. The service requires the `Cadet` or `Commander` role. Only Commanders can write. |
| Planet isolation | `srv/spacefarer-service.cds`, `srv/spacefarer-service.ts` | A `@restrict` condition limits reads and changes to the user's own planet. A `before` handler rejects writes that target another planet, because the condition only checks existing rows. |
| Validation | `db/schema.cds`, `srv/spacefarer-service.cds` | Suit color enum, email format, mandatory origin planet, existing position. |
| Tests | `test/spacefarer-service.test.ts` | Vitest with `cds.test`, covering authentication, roles, planet isolation, CRUD and validation. |

## Project layout

```
db/        data model and seed data (CSV)
srv/       service definition and handlers
test/      automated tests and the .http walkthrough
```

## Notes

- Authentication is mocked for local development. On SAP BTP the roles and the `planet` attribute would come from XSUAA or IAS, and the database would be SAP HANA Cloud. The service code stays the same.
- Local TypeScript support: `pnpm start` runs `cds-tsx serve`, which loads the `.ts` handlers through `tsx`.
