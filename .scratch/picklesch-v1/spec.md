# Spec: Picklesch v1 — Objective Pickleball Rating, Fair Matchmaking & Session Management

Status: ready-for-agent

**Scope:** Greenfield v1 end-state (backend + mobile + facility/tournament tooling), per the completed planning session (55 settled decisions, ADR-01–ADR-12).
**Domain vocabulary:** tier, provisional, rating deviation (RD), volatility, blowout, sandbagging, open-play session, check-in, court, waitlist, conservative seeding, dual-confirmation, dispute.

---

## Problem Statement

**As a recreational pickleball player**, my enjoyment depends on fair games, but every open-play session I attend runs on self-reported skill levels. I either get crushed by a "3.0" who plays like a 4.0, or I dominate beginners in an 11-1 blowout. Nobody trusts the numbers, paddles get stacked by whoever shows up first, and disputes about skill level sour the atmosphere.

**As a competitive player**, I can't find challenging matches or fair brackets. My local ranking is meaningless because it's built on unverified results and — worse — some players deliberately register below their true level (sandbagging) to win easy medals.

**As a facility operator**, I spend my sessions manually arranging courts, refereeing arguments about skill tiers, and watching players leave early because the games were lopsided. Court utilization suffers and the community culture turns hostile.

**As a tournament organizer**, I can't seed brackets from trustworthy data, and post-event sandbagging accusations fall on me with no objective record to point at.

## Solution

Picklesch is a mobile platform (React Native) backed by a Node.js/Express API and MongoDB that replaces self-reported skill with an **objective, performance-based rating** (Glicko-2, tracking rating, rating deviation, and volatility per player per format), **verifies match results through dual-confirmation with a dispute process**, and **auto-forms balanced courts during facility sessions** using a minimax algorithm with a hard skill-gap cap. Players check in by QR code, receive real-time court assignments, confirm scores from their phones, and watch their rating update immediately. Facility administrators get session templates and a health dashboard; tournament organizers get conservative, snapshot-frozen seeding data. Sandbagging is detected statistically through rating volatility and flagged for human review.

## User Stories

### Onboarding & identity
1. As a new player, I want to create an account with a unique email, so that my identity and rating belong only to me.
2. As a new player, I want to self-select my starting skill tier (2.5–4.0) during onboarding, so that my first matches are competitive.
3. As a new player, I want my initial rating set to the midpoint of my selected tier, so that I neither crush weaker players nor get crushed by stronger ones.
4. As a new player, I want to start flagged as provisional, so that the system knows my rating is still calibrating.
5. As a provisional player, I want my provisional flag to clear automatically after 12 matches, so that I fully join the general rating pool.
6. As a player who mis-selected my tier (three straight blowouts in my first three matches), I want the system to auto-adjust my rating and flag my profile, so that early mistakes are corrected without manual review.

### Provisional calibration
7. As a provisional player in my first five matches, I want to be matched only with other provisional players, so that my volatile rating cannot harm established players' games.
8. As a provisional player in matches six through twelve, I want to be gradually mixed into the general pool, so that I integrate smoothly while still calibrating.
9. As a provisional player, I want my high rating deviation to be excluded from matchmaking quality calculations for others, so that my uncertainty doesn't degrade anyone else's court.

### Rating engine
10. As a player, I want my rating computed objectively from match results (Glicko-2), so that it never depends on self-reporting.
11. As a player, I want separate doubles and singles ratings, so that my standing is accurate for each format I play.
12. As a player, I want my rating to update immediately after a match is verified, so that I see progress during the same session.
13. As a player, I want my rating shown as a familiar pickleball tier (2.5–5.0+) with the raw rating and RD as secondary detail, so that I understand my level and how certain it is.
14. As a player, I want a rating history chart showing rating and RD over time with per-match annotations (opponents, scores, rating change), so that I can learn how results move my rating.
15. As a player, I want my RD to visibly shrink as matches accumulate, so that I can watch my rating stabilize.
16. As a player, I want tier badges computed from fixed, published boundaries, so that tiers mean the same thing at every facility.

### Match record & verification
17. As a player, I want to submit a match score, so that the result enters verification.
18. As a player, I want the system to enforce win-by-2 and reject impossible scores for the session's scoring type, so that bad data never reaches my rating.
19. As a player, I want all four players to confirm a doubles score before ratings change, so that no single player can manipulate results.
20. As a player, I want a notification when a match is waiting for my confirmation, so that ratings aren't stuck in limbo.
21. As a player, I want to file a dispute within 24 hours of a match with photo evidence, so that honest scores are protected.
22. As a player, I want my rating frozen while a dispute is open, so that contested results cannot corrupt it.
23. As a player, I want the corrected result applied retroactively when a dispute succeeds, so that the record reflects the truth.
24. As a player, I want a choice of rally or traditional scoring per session, so that play matches local conventions.

### Sessions & matchmaking
25. As a player, I want to check in to a facility session by scanning a QR code, so that joining takes seconds.
26. As a player, I want to check in from 30 minutes before until 15 minutes after session start, so that minor lateness doesn't lock me out.
27. As a player, I want courts formed automatically every 15 minutes from checked-in players, so that nobody stacks paddles manually.
28. As a player, I want the strongest-to-weakest spread on my court capped at 0.5 rating points, so that blowouts are structurally prevented.
29. As a player, I want courts re-formed after every game using fresh ratings, so that every game stays competitive as ratings shift.
30. As a player, I want to request preferred partners, so that I can play with friends whenever the skill gap allows.
31. As a player, I want a private avoid list of up to five players, so that I am never placed on a court with them — and nobody sees the list.
32. As a waitlisted player, I want to see my position and the session's current state, so that I can decide whether to stay.
33. As a waitlisted player, I want priority based on proximity to the session's median rating, so that the next free court gets the most competitive game possible.
34. As a waitlisted player, I want auto-promotion with a two-minute acceptance window when someone cancels, so that courts never sit idle behind a stale waitlist.
35. As a player who checks in but never appears, I want to be flagged for a no-show when an admin or three-plus players confirm it, so that ghosting carries consequences.
36. As a punished no-show, I want a 24-hour session ban, so that the community standard is enforced consistently.
37. As an opponent of a no-show, I want my rating protected from the abandoned match, so that someone else's absence never hurts my standing.
38. As a player at a venue with poor connectivity, I want to enter scores offline and have them sync automatically when the connection returns, so that dead zones don't block the session.

### Real-time & notifications
39. As a player, I want real-time updates (court assignments, session status, waitlist promotions) pushed over a live connection, so that I never have to refresh.
40. As a player, I want push notifications for court assignment, match start, score-confirmation requests, dispute events, and session end, so that I never miss a beat.
41. As a player, I want to receive those notifications even when the app is closed, so that session flow doesn't depend on me watching my phone.

### Profile, privacy & data rights
42. As a player, I want a profile showing rating, RD, volatility, match count, and provisional status, so that other players can gauge match quality transparently.
43. As a player, I want independent privacy controls for profile visibility, match-history visibility, and leaderboard participation (public/friends-only/private), so that I choose my own exposure.
44. As a player, I want to export my full match history (CSV/JSON) with opponents, scores, and rating changes, so that I own my data.
45. As a departing player, I want my account deleted and personal data removed, so that I can leave the platform cleanly (GDPR).
46. As an active player, I want my match history retained indefinitely while my account exists, so that rating audits and integrity investigations remain possible.
47. As a player with one account, I want it to work at every facility on the platform, so that my rating and history follow me everywhere.

### Competitive play & tournaments
48. As a competitive player, I want tournament seeding to use my conservative rating (rating − 2×RD), so that rating uncertainty can't be exploited.
49. As a tournament organizer, I want a ratings snapshot frozen at registration close, so that seeds are stable and late rating moves can't be gamed.
50. As a tournament organizer, I want a seeding export API for my bracket tooling, so that seeds consume live ratings automatically.
51. As a tournament organizer, I want to see sandbagging flags before seeding, so that suspected cheaters can be excluded from brackets.

### Facility administration
52. As a facility owner, I want invite-based onboarding with a configuration flow, so that only legitimate facilities join the platform.
53. As a facility admin, I want to configure my courts and capacity before going live, so that sessions reflect my venue.
54. As a facility admin, I want reusable session templates with recurrence (once/weekly/biweekly/monthly) and skill/format filters, so that I set my schedule once.
55. As a facility admin, I want a dashboard showing court utilization %, average per-court skill gap, blowout rate, and waitlist statistics per session, so that I can see whether sessions are healthy.
56. As a facility admin, I want to resolve disputes by reviewing evidence and issuing a binding decision within the window, so that score conflicts end promptly.
57. As a facility admin, I want disputes I resolve to trigger retroactive rating correction for affected players, so that the platform stays internally consistent.
58. As a facility admin, I want permissions strictly scoped to my own facility, so that I cannot touch other operators' data.
59. As a super admin, I want an audit-logged impersonation mode for troubleshooting player issues, so that support never requires sharing passwords.

### Integrity & security
60. As a super admin, I want automatic flags when a player's volatility rises by more than 0.1 in a rating period and their rating drops more than 100 points over five matches, so that suspected sandbagging enters a review queue.
61. As a super admin, I want to review flagged players with their match timelines before acting, so that honest players are never banned on a heuristic alone.
62. As a player, I want secure login with short-lived access tokens and rotating refresh tokens bound to my device, so that stolen tokens are useless quickly.
63. As a player, I want per-user rate limits on score submissions and check-ins, so that bots cannot flood the platform.
64. As a platform operator, I want three isolated environments (development, staging, production) with separate databases and monitoring, so that testing never touches real players.
65. As a platform operator, I want a CI pipeline that runs lint, type checks, unit tests, integration tests, and builds before any deploy, so that broken code never ships.
66. As a player, I want over-the-air JavaScript updates, so that fixes reach me without waiting for app-store review — with mandatory updates when the API has changed incompatibly.
67. As a platform operator, I want production errors reported with readable stack traces, so that issues are diagnosable after release.

## Implementation Decisions

**Tech stack (ADR-12, confirmed):** React Native (Expo) mobile app; Node.js + Express backend; MongoDB with Mongoose ODM on MongoDB Atlas; Socket.io for real-time; JWT auth; Expo EAS Build + OTA updates; GitHub Actions CI/CD; Sentry monitoring; Jest + Supertest + Detox testing.

**Module boundaries (new, no existing code):**
- `rating-engine` — pure Glicko-2 computation: input is (result, players' rating states), output is new states. Separate state per format (doubles/singles). Parameters: τ = 0.5, initial rating 1500, initial RD 350, initial volatility 0.06 (standard defaults, ADR-01). Runs synchronously after each verified match (real-time, not batched).
- `matchmaking` — pure minimax court formation: input is (player pool with constraints), output is court assignments or waitlist placement. Honors hard 0.5-point cap, hard avoid lists, soft partner preferences, median-rating waitlist priority.
- `session-manager` — check-in windows, QR validation, 15-minute formation cadence, re-shuffle-after-each-game, waitlist promotion with 2-minute acceptance, no-show flagging.
- `match-verification` — submission validation, dual-confirmation tracking, 24-hour dispute window, freeze/retroactive-recompute orchestration.
- `sandbagging-detector` — evaluates volatility Δ > 0.1 per rating period AND rating drop > 100 over 5 matches; writes flags to a review queue; never auto-bans.
- `auth/rbac` — JWT with 15-minute access tokens, rotating refresh tokens with device fingerprinting; four roles (player, facility_admin, tournament_organizer, super_admin) with facility-scoped authorization.
- `notifications` — Socket.io rooms scoped per session for live updates; Expo/FCM/APNs push for five event types.
- `seeding-export` — conservative rating computation (rating − 2×RD) and point-in-time snapshot API.

**Schema decisions (MongoDB/Mongoose):**
- **User** carries two independent rating sub-states (doubles, singles), each with rating/RD/volatility; provisional flag and provisional match counter; selected initial tier and self-selection-validated flag; avoid list (max 5) and preferred partners as user references; three privacy settings (profile/history/leaderboard); role and facility memberships; refresh tokens with device fingerprints.
- **Match** carries both teams (two players each for doubles), scores, format (doubles/singles), scoring type (rally/traditional), a status state machine, the confirmation list, a dispute sub-record (filer, timestamps, evidence URLs, resolver, resolution, corrected scores), session linkage, rating-applied/rating-reverted flags, and a review flag.
- **Session** carries facility and optional template reference, start/end times, capacity, skill-range and format filters, QR code, computed check-in window (−30 min / +15 min), embedded courts each holding their current match, check-in records, a waitlist with positions and promotion timestamps, and status (upcoming/active/completed/cancelled).
- **Facility** carries courts with labels, admins, session templates with recurrence rules and filters, and an active flag gated on completed onboarding.
- **AuditLog** carries actor, action, target, details, and IP for every admin/impersonation action.
- Compound indexes: (session, status) on Match; (facility, startTime) on Session; (player, createdAt) on Match for history queries.

**Match state machine (decision-critical):**

```
pending_confirmation
  ├─(all 4 confirm)──▶ verified ──▶ ratings updated (applied=true)
  └─(dispute ≤24h)──▶ disputed ── ratings FROZEN for all involved
        ├─(admin upholds original)──▶ verified ──▶ ratings updated
        └─(admin overturns)──▶ corrected result applied ──▶ any applied
                               ratings reverted, then recomputed
                               from corrected scores
```

Unresolved after 24h with no dispute: auto-verify. Unconfirmed and undisputed: remains pending until a dispute window fully elapses.

**API contract (all under `/api/v1`, URL-versioned, 6-month deprecation window with headers):**
- `auth` — register (with tier selection), login, refresh, logout
- `players` — profile (rating states, tier, provisional), rating history with annotations, history export, privacy settings, avoid list, preferred partners
- `matches` — submit score (validated), confirm, dispute (with evidence), admin resolution
- `sessions` — list by facility, QR check-in, court status, waitlist position/promotion, formation trigger
- `facilities` — onboarding, court/template configuration, session dashboard metrics
- `tournaments` — snapshot creation at registration close, conservative seeding export
- `admin` — impersonation (audit-logged), sandbagging review queue

**Interaction rules:**
- Score validation: win-by-2 at the session's target score; reject scores violating the chosen scoring type; impossible combinations rejected before storage.
- Formation cadence: every 15 minutes during an active session; a court that cannot satisfy the 0.5 cap sends its overflow to the waitlist rather than forming a lopsided game.
- No-show: requires admin confirmation or 3+ peer confirmations → 24-hour session ban + opponent rating protection.
- Provisional mechanics: matches 1–5 provisional-only pools; 6–12 mixed; three-match self-selection validation window with auto-adjust.
- Fixed tier boundaries: 1200→2.5, 1400→3.0, 1600→3.5, 1800→4.0, 2000→4.5, 2200→5.0.
- Rate limits: 10 score submissions/minute, 30 check-ins/hour, per user.
- Environments: three isolated stacks (dev/staging/prod) with separate MongoDB clusters, API URLs, and Sentry projects.
- Seed generator: 100 synthetic players with realistic rating distribution + 500 historical matches for development/demo.
- CI pipeline order: lint → typecheck → unit → integration → build → deploy staging (main) → deploy production (tag).

**Tunables (centralized configuration, values chosen during planning):** τ, gap cap (0.5), formation cadence (15 min), provisional length (12), sandbagging thresholds (0.1 / 100 / 5), check-in windows (−30/+15), dispute window (24h), promotion acceptance (2 min), rate limits.

## Testing Decisions

**What makes a good test:** assert only external behavior — HTTP status codes and response payloads, WebSocket-visible outcomes, and persisted effects (a rating that changed to an expected value after a flow). Never assert on internal call graphs, private helpers, module wiring, or raw document layout. Tests should be expressible as "a player does X, then observes Y."

**Seam A — Backend API contract (primary, highest backend seam):** Supertest against the Express app with an isolated test database per run. Drives every server-side behavior through HTTP: registration/tier onboarding, QR check-in, court formation outcomes (assert the 0.5 cap is never exceeded and waitlist ordering), score submission and validation rejections, four-player confirmation, dispute open/freeze/retroactive-recompute flows, RBAC scoping (facility admin cannot touch another facility), dashboard aggregate values, seeding export contents, rate-limit responses. Rating numbers are observed through profile/history responses.

**Seam B — Glicko-2 rating engine (pure functions):** Jest unit tests with exact numeric vectors — known match sequences producing expected rating/RD/volatility triples. Vectors cover: first-match RD decay, provisional-period decay across five matches, doubles/singles state isolation, volatility behavior near floor/ceiling, ordered recompute after an overturned dispute, conservative seeding arithmetic (rating − 2×RD). Target: >90% coverage on rating math (ADR-12). Rationale for a second, lower seam: exact numeric assertions are the project's core correctness risk and are brittle/expensive to orchestrate through HTTP.

**Seam C — Mobile player journey (highest mobile seam):** Detox E2E against the built app plus the API, covering exactly one critical loop: launch → sign in → check in to a session → receive court assignment via live connection → enter and confirm a score → observe the rating/tier update → toggle airplane mode, enter another score, and verify sync on reconnect. All other mobile behavior (settings toggles, charts) stays at component-level Jest tests local to the mobile package and is not a cross-codebase seam.

**Prior art:** none — greenfield repository. The closest reference is the planned seed generator (100 players / 500 matches), which doubles as the fixture factory for Seam A tests. All three seams run in CI on every change (ADR-12).

## Out of Scope

- Payments, court booking, or pricing enforcement (facility pricing fields may exist but are not processed)
- Live streaming, video analysis, ball-tracking, or shot statistics
- Coaching marketplace or equipment marketplace
- Social feed, posts, comments, friend requests, and team ladders (deferred until post-launch demand is validated)
- ML-based court formation (minimax is v1; data-driven matchmaking deferred until real usage data exists)
- Multi-language / internationalization (single-market launch)
- A separate web application or admin web console (mobile app + API only)
- Wearables or watch apps
- Integration with USAPA/IFP sanctioning or official rating bodies
- Dynamic percentile-based tier boundaries (fixed boundaries chosen deliberately)
- Automatic bans for sandbagging (human review queue only)
- Facility-side court reservation scheduling (open-play session check-in only)

## Further Notes

- **Build order:** this spec describes the v1 end-state. The roadmap's seven phases (Foundation → Rating Engine → Integrity & Sessions → Matchmaking → Mobile Core → Facility/Tournament → Polish) define the delivery sequence; tickets should respect phase boundaries so the rating engine lands before sessions depend on it.
- **Assumptions to validate post-launch** (recorded in Open-Questions): τ and initial parameters, 12-match provisional length, fixed tier boundaries, 0.5 gap cap, 15-minute cadence, sandbagging thresholds, dual-confirmation friction, and dual-format pool fragmentation.
- **Glossary:** no `GLOSSARY.md` exists yet; the `/domain-modeling` skill creates it lazily. This spec uses the planning vocabulary (tier, provisional, RD, volatility, blowout, sandbagging, check-in, court, waitlist, conservative seeding, dual-confirmation, dispute) and should be reconciled with that glossary if terms diverge.
- **ADRs:** all implementation decisions above trace to ADR-01–ADR-12 in the Picklesch knowledge base (Obsidian vault). Conflicts between this spec and an ADR should be resolved in favor of the ADR unless this spec explicitly supersedes it.
- **Knowledge base:** `Picklesch/` in the Obsidian vault holds Requirements (FR/NFR traceability with Q# references), User Stories, Roadmap, Database Design, and the ADR index.
