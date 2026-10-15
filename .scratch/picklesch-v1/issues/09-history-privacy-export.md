# 09: Rating history chart, privacy controls, and data export

**What to build:** The profile grows into a player's data home: a chart of rating and RD over time with per-match annotations (opponents, scores, rating change), three independent visibility toggles (profile / match history / leaderboard — public, friends-only, private) enforced server-side, CSV/JSON export of the full match history, and account deletion that removes personal data while active accounts retain match history for audits.

**Blocked by:** 04 (Match confirmation loop with real-time Glicko-2 ratings)

**Status:** ready-for-agent

- [ ] Profile shows a rating/RD history chart annotated per match with opponents, scores, and rating deltas
- [ ] Profile visibility, history visibility, and leaderboard participation toggle independently and are enforced server-side
- [ ] Full match history exports as CSV and JSON including opponents, scores, and rating changes
- [ ] Account deletion removes personal data; match history of active accounts is retained indefinitely
- [ ] Component tests cover chart annotations; integration tests cover privacy enforcement and export contents
