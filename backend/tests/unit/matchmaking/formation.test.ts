import { formCourts, medianRating } from '../../../src/matchmaking';

const player = (id: string, rating: number) => ({ id, rating });

describe('matchmaking: minimax court formation (Seam B)', () => {
  it('forms a single court whose spread is within the cap', () => {
    const result = formCourts({
      players: [player('a', 1500), player('b', 1550), player('c', 1600), player('d', 1650)],
      courtSize: 4,
      maxCourts: 1,
      maxSpread: 200,
    });

    expect(result.courts).toHaveLength(1);
    expect(result.courts[0].spread).toBe(150);
    expect(result.waitlist).toHaveLength(0);
  });

  it('refuses to form a court that would exceed the cap and waitlists the pool', () => {
    const result = formCourts({
      players: [player('a', 1300), player('b', 1600), player('c', 1610), player('d', 1620)],
      courtSize: 4,
      maxCourts: 1,
      maxSpread: 200,
    });

    expect(result.courts).toHaveLength(0);
    expect(result.waitlist).toHaveLength(4);
  });

  it('treats the cap as inclusive (spread == cap is allowed)', () => {
    const within = formCourts({
      players: [player('a', 1500), player('b', 1700)],
      courtSize: 2,
      maxCourts: 1,
      maxSpread: 200,
    });
    expect(within.courts).toHaveLength(1);

    const over = formCourts({
      players: [player('a', 1500), player('b', 1701)],
      courtSize: 2,
      maxCourts: 1,
      maxSpread: 200,
    });
    expect(over.courts).toHaveLength(0);
  });

  it('minimises the maximum spread across courts', () => {
    const result = formCourts({
      players: [
        player('a', 1300),
        player('b', 1310),
        player('c', 1320),
        player('d', 1330),
        player('e', 1700),
        player('f', 1710),
        player('g', 1720),
        player('h', 1730),
      ],
      courtSize: 4,
      maxCourts: 2,
      maxSpread: 200,
    });

    expect(result.courts).toHaveLength(2);
    expect(Math.max(...result.courts.map((court) => court.spread))).toBe(30);
    expect(result.waitlist).toHaveLength(0);
  });

  it('prefers placing more players over a tighter, smaller formation', () => {
    const result = formCourts({
      players: [
        player('a', 1300),
        player('b', 1310),
        player('c', 1320),
        player('d', 1330),
        player('e', 1700),
        player('f', 1710),
        player('g', 1720),
        player('h', 1730),
      ],
      courtSize: 4,
      maxCourts: 2,
      maxSpread: 200,
    });

    expect(result.courts).toHaveLength(2);
    expect(result.waitlist).toHaveLength(0);
  });

  it('selects the tightest legal court when several windows fit', () => {
    const result = formCourts({
      players: [
        player('a', 1000),
        player('b', 1300),
        player('c', 1310),
        player('d', 1320),
        player('e', 1330),
        player('f', 1600),
        player('g', 1610),
        player('h', 1620),
        player('i', 1630),
        player('j', 1900),
      ],
      courtSize: 4,
      maxCourts: 1,
      maxSpread: 200,
    });

    expect(result.courts).toHaveLength(1);
    expect(result.courts[0].spread).toBe(30);
    expect(result.courts[0].players.map((entry) => entry.id)).toEqual(['f', 'g', 'h', 'i']);
  });

  it('orders the waitlist by proximity to the pool median', () => {
    const result = formCourts({
      players: [
        player('a', 1200),
        player('b', 1300),
        player('c', 1310),
        player('d', 1320),
        player('e', 1330),
        player('f', 1600),
      ],
      courtSize: 4,
      maxCourts: 1,
      maxSpread: 200,
    });

    expect(result.courts).toHaveLength(1);
    expect(result.courts[0].spread).toBe(30);
    expect(result.waitlist.map((entry) => entry.id)).toEqual(['a', 'f']);
  });

  it('never forms more courts than maxCourts', () => {
    const players = Array.from({ length: 12 }, (_value, index) =>
      player(`p${index}`, 1500 + index),
    );
    const result = formCourts({ players, courtSize: 4, maxCourts: 2, maxSpread: 1000 });

    expect(result.courts).toHaveLength(2);
    expect(result.waitlist).toHaveLength(4);
  });
});

describe('medianRating', () => {
  it('averages the two middle values for an even count', () => {
    expect(medianRating([1000, 2000, 3000, 4000])).toBe(2500);
  });

  it('returns the middle value for an odd count', () => {
    expect(medianRating([1300, 1500, 1700])).toBe(1500);
  });
});
