import { ratingToTier, tierMidpointRating } from '../../../src/rating-engine/tiers';

describe('rating-engine tier mapping (Seam B)', () => {
  it('maps each self-select tier to its midpoint rating', () => {
    expect(tierMidpointRating('2.5')).toBe(1300);
    expect(tierMidpointRating('3.0')).toBe(1500);
    expect(tierMidpointRating('3.5')).toBe(1700);
    expect(tierMidpointRating('4.0')).toBe(1900);
  });

  it('maps ratings to tiers at the fixed boundaries (ADR-10)', () => {
    expect(ratingToTier(1200)).toBe('2.5');
    expect(ratingToTier(1399)).toBe('2.5');
    expect(ratingToTier(1400)).toBe('3.0');
    expect(ratingToTier(1599)).toBe('3.0');
    expect(ratingToTier(1600)).toBe('3.5');
    expect(ratingToTier(1799)).toBe('3.5');
    expect(ratingToTier(1800)).toBe('4.0');
    expect(ratingToTier(1999)).toBe('4.0');
    expect(ratingToTier(2000)).toBe('4.5');
    expect(ratingToTier(2199)).toBe('4.5');
    expect(ratingToTier(2200)).toBe('5.0+');
  });

  it('clamps ratings below the lowest boundary to the lowest tier', () => {
    expect(ratingToTier(1000)).toBe('2.5');
  });
});
