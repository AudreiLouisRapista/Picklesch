# 06: Waitlist, per-game re-shuffle, and no-show penalties

**What to build:** The fifth player sees their waitlist position instead of a lopsided court. Cancellations auto-promote the top candidate with a two-minute acceptance window. After every game, courts re-form from fresh ratings so each successive game stays competitive. Players who check in but never appear get flagged (admin or three-plus peer confirmations), receive a 24-hour session ban, and their abandoned match never touches opponents' ratings.

**Blocked by:** 03 (Session check-in to live court formation), 04 (Match confirmation loop with real-time Glicko-2 ratings)

**Status:** ready-for-agent

- [ ] Overflow players are waitlisted with a visible position; ordering follows median-rating priority
- [ ] A cancellation auto-promotes the top candidate with a two-minute acceptance window; unaccepted promotions fall through to the next candidate
- [ ] Courts re-form after every game using updated ratings (minimax + 0.5 cap re-applied)
- [ ] No-show flagged by admin or 3+ confirmations → 24-hour session ban and opponent rating protection for the abandoned match
- [ ] Integration tests cover promotion timing, re-shuffle ordering, and the rating-protection path
