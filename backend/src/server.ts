import 'dotenv/config';

import { createServer } from 'node:http';

import { createApp } from './app';
import { loadConfig } from './config/env';
import { connectDatabase } from './config/database';
import { createRealtime } from './realtime';
import { startFormationScheduler } from './scheduler';

async function main(): Promise<void> {
  const config = loadConfig();

  await connectDatabase(config.mongoUri);

  const app = createApp();
  const server = createServer(app);

  createRealtime(server);
  startFormationScheduler();

  server.listen(config.port, () => {
    console.log(`Picklesch API (${config.env}) listening on http://localhost:${config.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start Picklesch API:', error);
  process.exit(1);
});
