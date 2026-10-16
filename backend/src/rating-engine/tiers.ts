export type Tier = '2.5' | '3.0' | '3.5' | '4.0' | '4.5' | '5.0+';

export interface TierBoundary {
  tier: Tier;
  min: number;
}

export const TIER_BOUNDARIES: readonly TierBoundary[] = [
  { tier: '2.5', min: 1200 },
  { tier: '3.0', min: 1400 },
  { tier: '3.5', min: 1600 },
  { tier: '4.0', min: 1800 },
  { tier: '4.5', min: 2000 },
  { tier: '5.0+', min: 2200 },
];

export type SelectableTier = '2.5' | '3.0' | '3.5' | '4.0';

export const SELECTABLE_TIERS: readonly SelectableTier[] = ['2.5', '3.0', '3.5', '4.0'];

export function isSelectableTier(value: unknown): value is SelectableTier {
  return typeof value === 'string' && (SELECTABLE_TIERS as readonly string[]).includes(value);
}

export function ratingToTier(rating: number): Tier {
  let current: Tier = TIER_BOUNDARIES[0].tier;

  for (const { tier, min } of TIER_BOUNDARIES) {
    if (rating >= min) {
      current = tier;
    }
  }

  return current;
}

export function tierMidpointRating(tier: SelectableTier): number {
  const index = TIER_BOUNDARIES.findIndex((boundary) => boundary.tier === tier);

  if (index === -1) {
    throw new Error(`Unknown selectable tier "${tier}"`);
  }

  const lower = TIER_BOUNDARIES[index].min;
  const upper = TIER_BOUNDARIES[index + 1]?.min ?? lower + 400;

  return (lower + upper) / 2;
}
