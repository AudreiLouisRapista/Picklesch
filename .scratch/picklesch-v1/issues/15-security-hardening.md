# 15: Security hardening — rate limits, device fingerprint, RBAC scoping, impersonation

**What to build:** The platform's defenses, end to end: per-user rate limits (10 score submissions/minute, 30 check-ins/hour → 429 responses), refresh tokens bound to a device fingerprint with reuse detected, facility-scoped authorization enforced on every admin route (including dispute resolution and facility configuration), and super-admin impersonation that leaves a complete audit trail (actor, action, target, timestamp, IP).

**Blocked by:** 02 (Provisional onboarding — sign-up with tier to provisional profile), 05 (Dispute flow with freeze and retroactive recompute), 13 (Facility onboarding and session templates)

**Status:** ready-for-agent

- [ ] Rate limits return 429 beyond 10 score submissions/minute and 30 check-ins/hour per user
- [ ] Refresh rotation is bound to a device fingerprint; presenting a rotated-out token is detected and rejected
- [ ] Every admin route enforces facility scoping — a Facility A admin receives 403-equivalent on Facility B resources
- [ ] Super-admin impersonation works for support and writes a complete audit log entry per action
- [ ] Integration tests cover each control: rate-limit bursts, token reuse, cross-facility access attempts, audit entries
