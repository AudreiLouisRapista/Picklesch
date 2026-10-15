# 13: Facility onboarding and session templates

**What to build:** Facilities join by invite link, configure their courts and capacity, and go live. Admins define reusable session templates (recurrence: once/weekly/biweekly/monthly, plus skill-range and format filters) that create sessions; new sessions are now admin-created rather than seed-only. The facility-admin role becomes assignable, and every admin action stays scoped to that facility.

**Blocked by:** 03 (Session check-in to live court formation)

**Status:** ready-for-agent

- [ ] Invite-based facility sign-up with court/capacity configuration flips the facility active
- [ ] Session templates with recurrence rules and skill/format filters create sessions on schedule
- [ ] The facility-admin role is assignable and admin-created sessions flow into check-in and formation like seeded ones
- [ ] Integration tests prove a facility admin cannot read or modify another facility's data
