export interface PoolPlayer {
  id: string;
  rating: number;
}

export interface CourtAssignment {
  players: PoolPlayer[];
  spread: number;
}

export interface FormationResult {
  courts: CourtAssignment[];
  waitlist: PoolPlayer[];
}

export interface FormationInput {
  players: PoolPlayer[];
  courtSize: number;
  maxCourts: number;
  maxSpread: number;
}

interface Best {
  courts: number;
  spread: number;
}

function preferFormation(candidate: Best, incumbent: Best): boolean {
  if (candidate.courts !== incumbent.courts) {
    return candidate.courts > incumbent.courts;
  }

  return candidate.spread < incumbent.spread;
}

export function medianRating(ratings: number[]): number {
  if (ratings.length === 0) {
    return 0;
  }

  const sorted = [...ratings].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export function orderWaitlist(waitlisted: PoolPlayer[], median: number): PoolPlayer[] {
  return [...waitlisted].sort((a, b) => {
    const distance = Math.abs(a.rating - median) - Math.abs(b.rating - median);

    if (distance !== 0) {
      return distance;
    }

    if (a.rating !== b.rating) {
      return a.rating - b.rating;
    }

    return a.id.localeCompare(b.id);
  });
}

export function formCourts({
  players,
  courtSize,
  maxCourts,
  maxSpread,
}: FormationInput): FormationResult {
  const median = medianRating(players.map((player) => player.rating));
  const sorted = [...players].sort((a, b) => {
    if (a.rating !== b.rating) {
      return a.rating - b.rating;
    }

    return a.id.localeCompare(b.id);
  });

  const n = sorted.length;
  const dp: Best[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: maxCourts + 1 }, () => ({ courts: 0, spread: 0 })),
  );
  const take: boolean[][] = Array.from({ length: n }, () =>
    Array.from({ length: maxCourts + 1 }, () => false),
  );

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let budget = 0; budget <= maxCourts; budget += 1) {
      let best = dp[i + 1][budget];

      if (budget > 0 && i + courtSize <= n) {
        const windowSpread = sorted[i + courtSize - 1].rating - sorted[i].rating;

        if (windowSpread <= maxSpread) {
          const rest = dp[i + courtSize][budget - 1];
          const candidate: Best = {
            courts: rest.courts + 1,
            spread: Math.max(windowSpread, rest.spread),
          };

          if (preferFormation(candidate, best)) {
            best = candidate;
            take[i][budget] = true;
          }
        }
      }

      dp[i][budget] = best;
    }
  }

  const courts: CourtAssignment[] = [];
  const placed = new Set<string>();
  let i = 0;
  let budget = maxCourts;

  while (i < n && courts.length < maxCourts) {
    if (take[i][budget]) {
      const group = sorted.slice(i, i + courtSize);
      courts.push({
        players: group,
        spread: group[group.length - 1].rating - group[0].rating,
      });
      group.forEach((player) => placed.add(player.id));
      i += courtSize;
      budget -= 1;
    } else {
      i += 1;
    }
  }

  const waitlisted = sorted.filter((player) => !placed.has(player.id));

  return { courts, waitlist: orderWaitlist(waitlisted, median) };
}
