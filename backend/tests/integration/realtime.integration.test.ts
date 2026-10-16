import { createServer, Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Socket, io as createClient } from 'socket.io-client';
import request from 'supertest';

import { createApp } from '../../src/app';
import { Session } from '../../src/models/Session';
import { User } from '../../src/models/User';
import { createRealtime } from '../../src/realtime';

interface AssignmentPayload {
  type: string;
  session: { id: string; courts: { spread: number }[] };
}

const app = createApp();

async function registerUser(email: string, tier: string): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'supersecret', name: email, tier });

  return response.body.accessToken as string;
}

describe('realtime court assignments (ADR-07)', () => {
  let mongod: MongoMemoryServer;
  let server: HttpServer;
  let client: Socket | undefined;
  let baseUrl: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'picklesch_realtime' });

    server = createServer(app);
    createRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }, 120_000);

  afterAll(async () => {
    client?.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
  });

  it('pushes court assignments to phones joined to the session room', async () => {
    const creatorToken = await registerUser('creator@example.com', '3.5');
    const start = new Date();
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        name: 'Live Play',
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        maxPlayers: 8,
      });
    const sessionId = created.body.session.id as string;
    const qrCode = created.body.session.qrCode as string;

    const tiers = ['3.0', '3.0', '3.5', '3.5'];
    for (let index = 0; index < tiers.length; index += 1) {
      const playerToken = await registerUser(`p${index}@example.com`, tiers[index]);
      await request(app)
        .post(`/api/v1/sessions/${sessionId}/checkin`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ qrCode });
    }

    client = createClient(baseUrl, {
      auth: { token: creatorToken },
      transports: ['websocket'],
      forceNew: true,
    });
    await new Promise<void>((resolve, reject) => {
      client?.on('connect', () => resolve());
      client?.on('connect_error', reject);
    });

    const assignment = new Promise<AssignmentPayload>((resolve) => {
      client?.on('court:assigned', (payload: AssignmentPayload) => resolve(payload));
    });

    client.emit('session:join', sessionId);
    await new Promise((resolve) => setTimeout(resolve, 150));

    await request(app)
      .post(`/api/v1/sessions/${sessionId}/formation`)
      .set('Authorization', `Bearer ${creatorToken}`);

    const payload = await assignment;
    expect(payload.type).toBe('court:assigned');
    expect(payload.session.id).toBe(sessionId);
    expect(payload.session.courts.length).toBeGreaterThan(0);
    expect(payload.session.courts.every((court) => court.spread <= 200)).toBe(true);
  }, 60_000);

  it('rejects a socket connection without a valid token', async () => {
    const unauthenticated = createClient(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
    });

    const error = await new Promise<Error>((resolve) => {
      unauthenticated.on('connect_error', resolve);
    });
    expect(error.message).toBe('unauthenticated');
    unauthenticated.close();
  }, 30_000);
});
