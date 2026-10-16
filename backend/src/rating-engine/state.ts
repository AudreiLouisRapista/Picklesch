import { SelectableTier, tierMidpointRating } from './tiers';

export interface RatingState {
  rating: number;
  rd: number;
  volatility: number;
}

export interface PlayerRatingStates {
  doubles: RatingState;
  singles: RatingState;
}

export const INITIAL_RD = 350;
export const INITIAL_VOLATILITY = 0.06;

export function initialRatingState(tier: SelectableTier): RatingState {
  return {
    rating: tierMidpointRating(tier),
    rd: INITIAL_RD,
    volatility: INITIAL_VOLATILITY,
  };
}

export function buildInitialRatingStates(tier: SelectableTier): PlayerRatingStates {
  return {
    doubles: initialRatingState(tier),
    singles: initialRatingState(tier),
  };
}
