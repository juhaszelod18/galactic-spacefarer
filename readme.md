# Galactic Spacefarer

SAP CAP (Node.js, TypeScript) service with a Fiori Elements List Report and Object Page for managing galactic spacefarers. Users only see and manage spacefarers from their own planet.

## Run it

Requires Node.js 22 and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm start   # in-memory SQLite, seeded from db/data
pnpm test
pnpm lint
```

Open <http://localhost:4004/galactic.spacefarers/index.html> and log in with one of the mocked users (development only, defined in `.cdsrc.json`):

| User  | Password | Role      | Planet |
|-------|----------|-----------|--------|
| alice | alice    | Commander | EARTH  |
| bob   | bob      | Commander | MARS   |
| carol | carol    | Cadet     | EARTH  |
| dave  | dave     | none      | EARTH  |

Each user only sees their own planet's spacefarers (Earth 23, Mars 12). Cadets can read, Commanders can also write, and `dave` has no access. The browser keeps Basic auth credentials, so switch users in a private window. The UI5 libraries load from the SAPUI5 CDN, so you need an internet connection.

To try the API without the UI, send the requests in [`test/http/SpacefarerService.http`](test/http/SpacefarerService.http) with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension. Each request states the status it should return.

## Welcome emails

Creating a spacefarer sends a congratulation email with [nodemailer](https://nodemailer.com).

- **Default:** a free [Ethereal](https://ethereal.email) test inbox is created on the first email, and a `previewUrl` is logged in the console. Open it to read the message.
- **Real SMTP:** copy `.env.example` to `.env` (gitignored), set the `SMTP_*` and `MAIL_FROM` values and restart.

The email is sent in the background after the save is committed, so a failed save sends nothing and a slow mail server does not delay the response. A failed email is logged and does not fail the request. Tests use an in-process fake SMTP server, so they need no network.

## Where things are

| Task | Where |
|------|-------|
| Data model | `db/schema.cds`, seed data in `db/data` |
| Service, CRUD and authorization | `srv/spacefarer-service.cds`, constraints in `srv/spacefarer-constraints.cds` |
| Event handlers and email | `srv/spacefarer-service.ts`, `srv/mailer.ts` |
| List Report and Object Page | `app/spacefarers/`, screens defined by `annotations.cds` |
| Tests | `test/spacefarer-service.test.ts` |

## Notes

- Authentication is mocked locally. On SAP BTP the roles and the `planet` attribute would come from XSUAA or IAS, and the database would be SAP HANA Cloud. The service code stays the same.
- The planet rule is a `@restrict` condition for reads, updates and deletes, plus a `before` handler for writes, because the condition only checks rows that already exist.
- Input rules (stardust of 0 or more, skill from 1 to 10, required name, email and planet) are declared in `srv/spacefarer-constraints.cds`, so they apply to creates, edits and direct API updates alike. Handler code covers what declarations can't: the planet rule, the welcome bonus, pre-filling the user's planet on a new draft and the welcome email.
- Spacefarers are draft-enabled, so the UI creates and edits them in a draft that is saved with the Save button. Validation, the planet rule, the stardust bonus and the welcome email run when the draft is saved. Over the API, a `POST` creates a draft and `draftActivate` saves it (see the `.http` file).
- Paging in the list is server-side (`$top` and `$skip`), shown with Fiori's "More" button. It loads 10 rows at a time.
