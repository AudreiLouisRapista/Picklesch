# 05: Dispute flow with freeze and retroactive recompute

**What to build:** A player disputes a score within 24 hours by attaching photo evidence; every involved player's rating freezes immediately. An admin (facility admin or super admin) reviews and either upholds the original result — match becomes verified and ratings apply — or overturns it: any already-applied ratings are reverted, the corrected scores are applied, and Glicko-2 is recomputed in order from the corrected result. The state machine in the spec is the contract.

**Blocked by:** 04 (Match confirmation loop with real-time Glicko-2 ratings)

**Status:** ready-for-agent

- [ ] A player can file a dispute with photo evidence within 24 hours of the match
- [ ] Rating changes for all involved players are frozen while the dispute is open
- [ ] Admin resolution path: uphold → match verified with original result and ratings applied
- [ ] Overturn path: prior applied ratings reverted, corrected scores applied, ratings recomputed from the corrected result
- [ ] Integration tests cover every state transition of the match state machine including the ordered retroactive recompute
