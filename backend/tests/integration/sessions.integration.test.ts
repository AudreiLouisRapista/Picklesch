import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app';
import { runDueFormations } from '../../src/modules/sessions/service';
import { Session } from '../../src/models/Session';
import { User } from '../../src/models/User';

const app = createApp();
let counter = 0;

async function registerPlayer(tier: string): Promise<string> {
  counter += 1;
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `player${counter}@example.com`,
      password: 'supersecret',
      name: `Player ${counter}`,
      tier,
    });

  return response.body.accessToken as string;
}

function sessionBody(overrides: Record<string, unknown> = {}) {
  const start = new Date();

  return {
    name: 'Monday Open Play',
    startTime: start.toISOString(),
    endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    maxPlayers: 8,
    ...overrides,
  };
}

function createSession(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/v1/sessions')
    .set('Authorization', `Bearer ${token}`)
    .send(sessionBody(overrides));
}

function checkIn(token: string, sessionId: string, qrCode: string) {
  return request(app)
    .post(`/api/v1/sessions/${sessionId}/checkin`)
    .set('Authorization', `Bearer ${token}`)
    .send({ qrCode });
}

function formCourts(token: string, sessionId: string) {
  return request(app)
    .post(`/api/v1/sessions/${sessionId}/formation`)
    .set('Authorization', `Bearer ${token}`);
}

describe('session check-in & court formation (Seam A)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'picklesch_sessions' });
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
  });

  it('creates a session with a check-in window and derived courts', async () => {
    const token = await registerPlayer('3.0');
    const response = await createSession(token);

    expect(response.status).toBe(201);
    expect(response.body.session).toMatchObject({
      name: 'Monday Open Play',
      status: 'upcoming',
      checkInOpen: true,
      maxPlayers: 8,
      courtCount: 2,
    });
    expect(response.body.session.qrCode).toEqual(expect.any(String));
    expect(new Date(response.body.session.checkInClosesAt).getTime()).toBeGreaterThan(
      new Date(response.body.session.startTime).getTime(),
    );
  });

  it('never exposes the QR code to anyone but the session creator', async () => {
    const token = await registerPlayer('3.0');
    const created = await createSession(token);
    const sessionId = created.body.session.id as string;

    const other = await registerPlayer('3.5');
    const seen = await request(app)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${other}`);

    expect(seen.status).toBe(200);
    expect(seen.body.session.qrCode).toBeNull();
  });

  it('rejects an invalid time range with 422', async () => {
    const token = await registerPlayer('3.0');
    const start = new Date();
    const response = await createSession(token, {
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() - 60_000).toISOString(),
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('invalid_time_range');
  });

  it('checks a player into the pool, is idempotent, and rejects a bad QR code', async () => {
    const token = await registerPlayer('3.0');
    const created = await createSession(token);
    const sessionId = created.body.session.id as string;
    const qrCode = created.body.session.qrCode as string;
    const player = await registerPlayer('3.0');

    const bad = await checkIn(player, sessionId, 'not-the-code');
    expect(bad.status).toBe(403);
    expect(bad.body.error.code).toBe('invalid_qr');

    const ok = await checkIn(player, sessionId, qrCode);
    expect(ok.status).toBe(200);
    expect(ok.body.session.checkedInCount).toBe(1);
    expect(ok.body.session.viewer.checkedIn).toBe(true);

    const again = await checkIn(player, sessionId, qrCode);
    expect(again.body.session.checkedInCount).toBe(1);
  });

  it('rejects a check-in outside the window with 422', async () => {
    const token = await registerPlayer('3.0');
    const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const created = await createSession(token, {
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    });
    const player = await registerPlayer('3.0');

    const response = await checkIn(
      player,
      created.body.session.id as string,
      created.body.session.qrCode as string,
    );

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('check_in_closed');
  });

  it('rejects a check-in once the session is at capacity with 409', async () => {
    const token = await registerPlayer('3.0');
    const created = await createSession(token, { maxPlayers: 2 });
    const sessionId = created.body.session.id as string;
    const qrCode = created.body.session.qrCode as string;

    await checkIn(await registerPlayer('3.0'), sessionId, qrCode);
    await checkIn(await registerPlayer('3.0'), sessionId, qrCode);
    const overflow = await checkIn(await registerPlayer('3.0'), sessionId, qrCode);

    expect(overflow.status).toBe(409);
    expect(overflow.body.error.code).toBe('session_full');
  });

  it('never exceeds the 0.5 cap and waitlists overflow by median-rating priority', async () => {
    const token = await registerPlayer('3.0');
    const created = await createSession(token, { maxPlayers: 6 });
    const sessionId = created.body.session.id as string;
    const qrCode = created.body.session.qrCode as string;

    const tiers = ['2.5', '3.0', '3.5', '3.5', '4.0', '4.0'];
    const tokens = [] as string[];
    for (const tier of tiers) {
      tokens.push(await registerPlayer(tier));
    }
    for (const playerToken of tokens) {
      const response = await checkIn(playerToken, sessionId, qrCode);
      expect(response.status).toBe(200);
    }

    const formation = await formCourts(token, sessionId);
    expect(formation.status).toBe(200);
    const view = formation.body.session;

    expect(view.courts).toHaveLength(1);
    expect(view.courts.every((court: { spread: number }) => court.spread <= 200)).toBe(true);
    expect(view.courts[0].spread).toBe(200);

    const courtRatings = view.courts[0].players.map((p: { rating: number }) => p.rating).sort();
    expect(courtRatings).toEqual([1700, 1700, 1900, 1900]);

    expect(view.waitlist.map((entry: { position: number }) => entry.position)).toEqual([1, 2]);
    expect(
      view.waitlist.map((entry: { player: { rating: number } }) => entry.player.rating),
    ).toEqual([1500, 1300]);
  });

  it('reports each viewer their court or waitlist position', async () => {
    const token = await registerPlayer('3.0');
    const created = await createSession(token, { maxPlayers: 6 });
    const sessionId = created.body.session.id as string;
    const qrCode = created.body.session.qrCode as string;

    const tiers = ['2.5', '3.0', '3.5', '3.5', '4.0', '4.0'];
    const tokens = [] as string[];
    for (const tier of tiers) {
      tokens.push(await registerPlayer(tier));
    }
    for (const playerToken of tokens) {
      await checkIn(playerToken, sessionId, qrCode);
    }
    await formCourts(token, sessionId);

    const onCourt = await request(app)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokens[2]}`);
    expect(onCourt.body.session.viewer).toMatchObject({
      checkedIn: true,
      courtLabel: 'Court 1',
      waitlistPosition: null,
    });

    const waiting = await request(app)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokens[0]}`);
    expect(waiting.body.session.viewer).toMatchObject({
      checkedIn: true,
      courtLabel: null,
      waitlistPosition: 2,
    });
  });

  it('forms due courts on the cadence sweep and advances the session to active', async () => {
    const token = await registerPlayer('3.0');
    const start = new Date(Date.now() - 60_000);
    const created = await createSession(token, {
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    });
    const sessionId = created.body.session.id as string;
    const qrCode = created.body.session.qrCode as string;

    for (const tier of ['3.0', '3.0', '3.5', '3.5']) {
      await checkIn(await registerPlayer(tier), sessionId, qrCode);
    }

    const first = await runDueFormations();
    expect(first.map((session) => String(session._id))).toContain(sessionId);

    const after = await request(app)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.session.status).toBe('active');
    expect(after.body.session.courts[0].players).toHaveLength(4);

    const second = await runDueFormations();
    expect(second.map((session) => String(session._id))).not.toContain(sessionId);
  });

  it('requires authentication for session endpoints', async () => {
    const response = await request(app).get('/api/v1/sessions/000000000000000000000000');

    expect(response.status).toBe(401);
  });
});
