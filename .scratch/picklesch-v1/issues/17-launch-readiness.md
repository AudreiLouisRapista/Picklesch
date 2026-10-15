# 17: Launch readiness — OTA, error monitoring, store builds, load and security pass

**What to build:** The v1 release train: over-the-air JavaScript updates ship fixes without store review (with a mandatory-update flag when the API changed incompatibly), Sentry receives production errors with readable stack traces from CI-uploaded source maps, EAS produces internal (TestFlight/Play Internal) and store builds from tags, a load test sustains 500 concurrent session participants, and a security pass is recorded before store submission.

**Blocked by:** 06 (Waitlist, per-game re-shuffle, and no-show penalties), 07 (Provisional calibration and tier self-selection validation), 08 (Partner preference and private avoid list), 09 (Rating history chart, privacy controls, and data export), 10 (Push notifications for the five session events), 11 (Offline score entry with background sync), 14 (Session dashboard metrics), 15 (Security hardening), 16 (Tournament seeding — conservative export, snapshot, flag visibility)

**Status:** ready-for-agent

- [ ] OTA updates deliver JS changes to installed apps; a breaking API change forces the mandatory update path
- [ ] Sentry shows production errors with readable stack traces (source maps uploaded by CI)
- [ ] A tagged release produces EAS internal-distribution builds and store-ready builds
- [ ] Load test sustains 500 concurrent session participants within agreed latency targets
- [ ] Security pass recorded (rate limits, auth, RBAC verified end to end) and store assets prepared
