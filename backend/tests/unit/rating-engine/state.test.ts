import {
  INITIAL_RD,
  INITIAL_VOLATILITY,
  buildInitialRatingStates,
  initialRatingState,
} from '../../../src/rating-engine/state';

describe('rating-engine initial state construction (Seam B)', () => {
  it('constructs an initial state at the tier midpoint with RD 350 and volatility 0.06', () => {
    expect(initialRatingState('3.0')).toEqual({ rating: 1500, rd: 350, volatility: 0.06 });
    expect(INITIAL_RD).toBe(350);
    expect(INITIAL_VOLATILITY).toBe(0.06);
  });

  it('builds independent but equal doubles and singles states for a new player', () => {
    const states = buildInitialRatingStates('3.5');

    expect(states.doubles).toEqual({ rating: 1700, rd: 350, volatility: 0.06 });
    expect(states.singles).toEqual({ rating: 1700, rd: 350, volatility: 0.06 });
    expect(states.doubles).not.toBe(states.singles);
  });
});
