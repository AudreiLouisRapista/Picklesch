import request from 'supertest';

import { createApp } from '../../src/app';

describe('environment profiles via GET /api/v1/health', () => {
  const originalEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it.each(['development', 'staging', 'production'] as const)(
    'reports the active %s profile',
    async (profile) => {
      process.env.NODE_ENV = profile;

      const response = await request(createApp()).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: 'ok', env: profile });
    },
  );

  it('reports the test profile during test runs', async () => {
    process.env.NODE_ENV = 'test';

    const response = await request(createApp()).get('/api/v1/health');

    expect(response.body).toMatchObject({ env: 'test' });
  });
});
