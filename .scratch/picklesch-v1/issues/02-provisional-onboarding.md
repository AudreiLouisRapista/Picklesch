# 02: Provisional onboarding — sign-up with tier to provisional profile

**What to build:** A new player installs the app, registers with email/password, and picks a starting skill tier (2.5–4.0). The account is created with the tier-midpoint rating, provisional flag, and initial rating deviation (RD 350) as independent doubles and singles rating states. Logging in lands on a profile screen showing the tier badge, provisional status, and RD. Access tokens are short-lived with rotating refresh.

**Blocked by:** 01 (Scaffold monorepo, CI pipeline, health check)

**Status:** ready-for-agent

- [ ] A new player can register with email/password and a self-selected tier (2.5–4.0) from the mobile app
- [ ] The account is created with rating at the tier midpoint, RD 350, provisional flag, and separate doubles and singles rating states
- [ ] Login issues a short-lived access token plus rotating refresh token; the profile screen shows tier badge, provisional status, and RD
- [ ] Rating-engine unit tests cover the tier-to-rating mapping and initial-state construction (first Seam B vectors)
