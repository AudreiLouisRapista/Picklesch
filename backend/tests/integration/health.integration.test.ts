import request from 'supertest';

import { createApp } from '../../src/app';

describe('GET /api/v1/health', () => {
  it('returns success for the versioned health endpoint', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });
});
