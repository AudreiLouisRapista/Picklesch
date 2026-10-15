# 07: Provisional calibration and tier self-selection validation

**What to build:** New players graduate properly: matches 1–5 draw courts only from the provisional-only pool, matches 6–12 mix them into the general pool, and the provisional flag clears at match 12. A player who mis-picked their tier (three blowouts in their first three matches) gets their initial rating auto-adjusted and the profile flagged — early mistakes self-correct without manual review.

**Blocked by:** 03 (Session check-in to live court formation), 04 (Match confirmation loop with real-time Glicko-2 ratings)

**Status:** ready-for-agent

- [ ] Formation draws provisional players only for matches 1–5, then mixes them into the general pool for matches 6–12
- [ ] The provisional flag clears automatically at 12 matches, after which the rating fully participates in matchmaking quality
- [ ] Three blowouts across the first three matches trigger an initial-rating auto-adjust and a profile flag
- [ ] Tests cover pool partitioning by provisional phase, graduation, and the validation-window adjustment
