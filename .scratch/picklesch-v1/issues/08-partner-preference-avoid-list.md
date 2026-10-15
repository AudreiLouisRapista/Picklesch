# 08: Partner preference and private avoid list

**What to build:** Settings where a player tags preferred partners and keeps a private avoid list (max five). Formation treats the avoid list as a hard constraint — those players are never co-court'd, and nobody else can see the list — while partner requests are soft: honored whenever the 0.5-point cap still holds.

**Blocked by:** 03 (Session check-in to live court formation)

**Status:** ready-for-agent

- [ ] Settings UI manages preferred partners and an avoid list capped at five, visible only to its owner
- [ ] Formation never places avoid-listed players on the same court, across any run
- [ ] Partner preferences are honored whenever honoring them keeps every court within the 0.5-point cap
- [ ] Integration tests assert the hard avoid constraint and the soft partner preference across multiple formation runs
