# 11: Offline score entry with background sync

**What to build:** A player in a dead zone still records the game: score entry works in airplane mode, queues locally, and syncs in order when the connection returns. Server-side validation (win-by-2, scoring type, confirmations) still applies on arrival, and the player sees the verified result and rating update once it lands.

**Blocked by:** 04 (Match confirmation loop with real-time Glicko-2 ratings)

**Status:** ready-for-agent

- [ ] Scores can be entered while offline and are queued locally on the device
- [ ] On reconnect, the queue syncs in submission order and server validation applies before ratings change
- [ ] The Detox critical journey gains its offline leg: airplane mode → record score → reconnect → match verified and rating updated
- [ ] Rejected queued entries surface a clear error to the player instead of silently vanishing
