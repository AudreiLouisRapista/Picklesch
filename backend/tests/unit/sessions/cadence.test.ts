import { isCheckInOpen, shouldForm } from '../../../src/modules/sessions/service';
import type { SessionDocument } from '../../../src/models/Session';

function session(overrides: Record<string, unknown> = {}): SessionDocument {
  return {
    status: 'upcoming',
    startTime: new Date('2026-01-01T10:00:00Z'),
    checkInOpensAt: new Date('2026-01-01T09:30:00Z'),
    checkInClosesAt: new Date('2026-01-01T10:15:00Z'),
    lastFormedAt: null,
    ...overrides,
  } as unknown as SessionDocument;
}

describe('session check-in window', () => {
  it('is open from 30 minutes before to 15 minutes after start', () => {
    const current = session();

    expect(isCheckInOpen(current, new Date('2026-01-01T09:29:00Z'))).toBe(false);
    expect(isCheckInOpen(current, new Date('2026-01-01T09:30:00Z'))).toBe(true);
    expect(isCheckInOpen(current, new Date('2026-01-01T10:00:00Z'))).toBe(true);
    expect(isCheckInOpen(current, new Date('2026-01-01T10:15:00Z'))).toBe(true);
    expect(isCheckInOpen(current, new Date('2026-01-01T10:16:00Z'))).toBe(false);
  });

  it('never opens for a completed or cancelled session', () => {
    expect(isCheckInOpen(session({ status: 'completed' }), new Date('2026-01-01T10:00:00Z'))).toBe(
      false,
    );
    expect(isCheckInOpen(session({ status: 'cancelled' }), new Date('2026-01-01T10:00:00Z'))).toBe(
      false,
    );
  });
});

describe('formation cadence', () => {
  it('forms immediately when the session has never formed', () => {
    expect(shouldForm(session(), new Date('2026-01-01T10:00:00Z'))).toBe(true);
  });

  it('waits a full 15 minutes between formations', () => {
    const formed = session({ lastFormedAt: new Date('2026-01-01T10:00:00Z') });

    expect(shouldForm(formed, new Date('2026-01-01T10:14:00Z'))).toBe(false);
    expect(shouldForm(formed, new Date('2026-01-01T10:15:00Z'))).toBe(true);
  });
});
