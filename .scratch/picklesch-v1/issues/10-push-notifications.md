# 10: Push notifications for the five session events

**What to build:** Players get buzzed at exactly the right moments even with the app closed: court assignment, match start, score-confirmation request, dispute events, and session end all arrive as push notifications via Expo/FCM/APNs after device token registration.

**Blocked by:** 03 (Session check-in to live court formation), 04 (Match confirmation loop with real-time Glicko-2 ratings), 05 (Dispute flow with freeze and retroactive recompute)

**Status:** ready-for-agent

- [ ] Device tokens register on sign-in; notifications deliver with the app closed
- [ ] All five event types push: court assignment, match start, score-confirmation request, dispute events, session end
- [ ] Each event fires exactly when the corresponding state change occurs (no notification without its trigger)
- [ ] Integration tests assert notification dispatch for each event type, including the dispute lifecycle
