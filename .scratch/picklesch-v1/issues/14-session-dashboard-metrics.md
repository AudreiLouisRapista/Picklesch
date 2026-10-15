# 14: Session dashboard metrics

**What to build:** After a session, the facility admin sees its health at a glance: court utilization %, average per-court skill gap, blowout rate (share of matches beyond the blowout threshold), and waitlist statistics — the numbers that prove whether matchmaking is working.

**Blocked by:** 04 (Match confirmation loop with real-time Glicko-2 ratings), 13 (Facility onboarding and session templates)

**Status:** ready-for-agent

- [ ] The dashboard shows per-session court utilization %, average skill gap, blowout rate, and waitlist statistics
- [ ] Metric values match hand-computed expectations on fixture sessions in integration tests
- [ ] The dashboard is reachable only by admins of that facility
