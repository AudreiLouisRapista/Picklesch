# 01: Scaffold monorepo, CI pipeline, health check

**What to build:** A greenfield repository that builds and proves itself: backend and Expo mobile skeletons side by side, a CI pipeline that runs lint, typecheck, unit, integration, and build stages on every push, and a trivial health endpoint under the versioned API prefix that answers under an integration test. Environments exist as three isolated profiles (development, staging, production) from day one.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] CI runs lint, typecheck, unit, integration, and build stages on every push, all green
- [ ] A health endpoint under the `/api/v1` prefix returns success in an integration test against an isolated test database
- [ ] Backend and mobile skeletons build in CI with no manual setup
- [ ] Three isolated environment profiles (development, staging, production) exist with separate configuration for database, API URL, and monitoring
