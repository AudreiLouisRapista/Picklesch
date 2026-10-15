# 12: Sandbagging detection and review queue

**What to build:** Statistical integrity: whenever a player's volatility rises by more than 0.1 in a rating period AND their rating drops more than 100 points over five matches, they are flagged — never auto-banned. Super admins see a review queue listing flagged players with their match timelines and a flag on the profile; the human decides.

**Blocked by:** 04 (Match confirmation loop with real-time Glicko-2 ratings)

**Status:** ready-for-agent

- [ ] The detector evaluates both thresholds (volatility Δ > 0.1 AND rating drop > 100 over 5 matches) after rating updates
- [ ] Flagged players appear in a super-admin review queue with a match timeline and a visible profile flag
- [ ] No automatic ban or rating manipulation occurs from detection alone
- [ ] Unit tests cover threshold boundaries (just under / just over / single-signal-only → no flag)
