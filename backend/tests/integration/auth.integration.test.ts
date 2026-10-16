import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app';
import { User } from '../../src/models/User';

const app = createApp();

function register(overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/v1/auth/register')
    .send({
      email: 'player@example.com',
      password: 'supersecret',
      name: 'Player One',
      tier: '3.5',
      deviceFingerprint: 'device-a',
      ...overrides,
    });
}

describe('auth + provisional onboarding (Seam A)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'picklesch_test' });
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('creates a provisional player at the tier midpoint with separate doubles/singles states (AC2)', async () => {
    const response = await register({ tier: '3.5' });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Player One',
      email: 'player@example.com',
      tier: '3.5',
      provisional: true,
      provisionalMatches: 0,
      selfSelectionValidated: false,
      matchesPlayed: 0,
    });
    expect(response.body.user.doubles).toEqual({ rating: 1700, rd: 350, volatility: 0.06 });
    expect(response.body.user.singles).toEqual({ rating: 1700, rd: 350, volatility: 0.06 });
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));

    const stored = await User.findOne({ email: 'player@example.com' });
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toContain('supersecret');
    expect(stored?.refreshTokens).toHaveLength(1);
  });

  it.each([
    ['an unsupported tier', { tier: '5.0' }, 'invalid_tier'],
    ['a short password', { password: 'short' }, 'invalid_password'],
    ['a malformed email', { email: 'not-an-email' }, 'invalid_email'],
  ])('rejects %s with 422', async (_label, overrides, code) => {
    const response = await register(overrides);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe(code);
  });

  it('rejects a duplicate email with 409', async () => {
    await register();
    const response = await register();

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('email_taken');
  });

  it('issues tokens on valid credentials and rejects a wrong password (AC3)', async () => {
    await register();

    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'player@example.com', password: 'supersecret' });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toEqual(expect.any(String));
    expect(ok.body.refreshToken).toEqual(expect.any(String));

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'player@example.com', password: 'wrong-password' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('invalid_credentials');
  });

  it('rotates refresh tokens and invalidates the previous one (ADR-08)', async () => {
    const registered = await register();
    const firstRefreshToken = registered.body.refreshToken as string;

    const rotated = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefreshToken, deviceFingerprint: 'device-a' });
    expect(rotated.status).toBe(200);
    expect(rotated.body.accessToken).toEqual(expect.any(String));
    expect(rotated.body.refreshToken).toEqual(expect.any(String));
    expect(rotated.body.refreshToken).not.toBe(firstRefreshToken);

    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefreshToken, deviceFingerprint: 'device-a' });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('invalid_refresh_token');

    const secondRotation = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken, deviceFingerprint: 'device-a' });
    expect(secondRotation.status).toBe(200);
  });

  it('rejects a refresh token presented from a different device (ADR-08)', async () => {
    const registered = await register();
    const refreshToken = registered.body.refreshToken as string;

    const stolen = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken, deviceFingerprint: 'device-b' });
    expect(stolen.status).toBe(401);
    expect(stolen.body.error.code).toBe('invalid_refresh_token');
  });

  it('invalidates the refresh token on logout', async () => {
    const registered = await register();
    const refreshToken = registered.body.refreshToken as string;

    const logout = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logout.status).toBe(204);

    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken, deviceFingerprint: 'device-a' });
    expect(reuse.status).toBe(401);
  });

  it('returns the profile for an authenticated player and 401 otherwise (AC3)', async () => {
    const registered = await register({ tier: '2.5' });
    const accessToken = registered.body.accessToken as string;

    const me = await request(app)
      .get('/api/v1/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({
      tier: '2.5',
      ratingTier: '2.5',
      provisional: true,
      provisionalMatchesRequired: 12,
    });
    expect(me.body.user.doubles).toEqual({ rating: 1300, rd: 350, volatility: 0.06 });

    const unauthenticated = await request(app).get('/api/v1/players/me');
    expect(unauthenticated.status).toBe(401);
  });
});
