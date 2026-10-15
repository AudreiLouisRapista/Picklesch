# 01: Scaffold monorepo, CI pipeline, health check

**What to build:** A greenfield repository that builds and proves itself: backend and Expo mobile skeletons side by side, a CI pipeline that runs lint, typecheck, unit, integration, and build stages on every push, and a trivial health endpoint under the versioned API prefix that answers under an integration test. Environments exist as three isolated profiles (development, staging, production) from day one.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] CI runs lint, typecheck, unit, integration, and build stages on every push, all green
- [x] A health endpoint under the `/api/v1` prefix returns success in an integration test against an isolated test database
- [x] Backend and mobile skeletons build in CI with no manual setup
- [x] Three isolated environment profiles (development, staging, production) exist with separate configuration for database, API URL, and monitoring

## Comments

### 2026-10-16 — implemented by agent (Seam A, TDD)

Red-green cycles: (1) health 200 `{status:'ok'}` under `/api/v1`, (2) health reports
isolated test DB (`mongodb-memory-server`, `db.name=picklesch_test`), (3) health reports
active env profile (`development`/`staging`/`production`/`test` asserted via the endpoint).

Verification (all run locally, all green):

- `npm run lint` — ESLint 9 flat config + Prettier, backend + mobile
- `npm run typecheck` — strict `tsc --noEmit`, backend + mobile
- `npm run test:unit` — green with **0 unit tests** (`--passWithNoTests`; seam-B Glicko-2
  tests belong to a later ticket)
- `npm run test:integration` — 3 suites, 6 tests, isolated in-memory MongoDB
- `npm run build` — backend `tsc` → `dist/`, mobile `expo export` (Android bundle, 578 modules)

Environment profiles: `backend/.env.example` documents all three profiles with separate
`MONGODB_URI` (database), `API_BASE_URL`/`PORT` (API URL), and `SENTRY_DSN` (monitoring);
`backend/src/config/env.ts` validates `NODE_ENV` against the profile list.

Known limitation: `.github/workflows/ci.yml` is written with the five stages as separate
steps on push/PR, but this repo has **no GitHub remote yet**, so the workflow itself could
only be verified by running its commands locally (done above). Actual on-push execution
starts working as soon as a remote is added.
