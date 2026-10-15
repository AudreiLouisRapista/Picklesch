# 16: Tournament seeding — conservative export, snapshot, flag visibility

**What to build:** Tournament organizers pull trustworthy seeds: a seeding export returns each player's conservative rating (rating − 2×RD), a snapshot freezes all ratings at registration close so late moves can't game the bracket, and sandbagging flags sit beside flagged players before seeding.

**Blocked by:** 04 (Match confirmation loop with real-time Glicko-2 ratings), 12 (Sandbagging detection and review queue)

**Status:** ready-for-agent

- [ ] The seeding export returns rating − 2×RD per player for the requested pool
- [ ] A snapshot taken at registration close is immutable — later rating changes never alter it
- [ ] Sandbagging flags are visible alongside flagged players in the organizer's seeding view
- [ ] Tests assert conservative-arithmetic correctness (Seam B vector) and snapshot immutability
