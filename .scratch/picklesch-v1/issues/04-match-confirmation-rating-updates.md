# 04: Match confirmation loop with real-time Glicko-2 ratings

**What to build:** The core loop closes: on an assigned court, a player enters the score (validated — win-by-2 and the session's scoring type enforced), all four players confirm, the match flips to verified, and the Glicko-2 engine updates every player's rating immediately. The profile rating, tier badge, and history move on screen right after confirmation. The full seed generator (100 players, 500 historical matches) and the Detox critical journey through rating update land here.

**Blocked by:** 03 (Session check-in to live court formation)

**Status:** ready-for-agent

- [ ] Score entry enforces win-by-2 and the session scoring type; impossible scores are rejected before storage
- [ ] Ratings update only after all four players confirm (dual-confirmation), immediately upon verification
- [ ] Profile rating, tier, and match history reflect the update in real time
- [ ] Rating-engine vector suite passes with >90% coverage on rating math (Seam B complete for v1 core)
- [ ] Seed generator produces 100 synthetic players with a realistic rating distribution and 500 historical matches
- [ ] Detox E2E covers sign-in → check-in → court assignment → score entry → confirmation → visible rating update
