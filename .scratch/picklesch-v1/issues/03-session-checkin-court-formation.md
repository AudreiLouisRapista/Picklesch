# 03: Session check-in to live court formation

**What to build:** A seeded facility session with a QR code accepts players: a phone scans/joins within the check-in window (30 minutes before to 15 minutes after start) and enters the pool. Every 15 minutes the session forms courts via the minimax algorithm — no court ever exceeds the 0.5-point rating spread, overflow goes to the waitlist — and each checked-in phone receives the court assignment live over a WebSocket, showing opponents and their ratings.

**Blocked by:** 02 (Provisional onboarding — sign-up with tier to provisional profile)

**Status:** ready-for-agent

- [ ] QR check-in from the mobile app joins a player to the session pool, with the check-in window enforced
- [ ] Formation runs on the 15-minute cadence, applies minimax with the 0.5-point hard cap, and waitlists players when no legal court can form
- [ ] Court assignments are pushed in real time to checked-in phones showing opponents and ratings
- [ ] Integration tests drive check-ins and assert the cap is never exceeded and waitlist ordering respects median-rating priority
