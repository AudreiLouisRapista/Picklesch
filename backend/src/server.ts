import 'dotenv/config';

import { createApp } from './app';
import { loadConfig } from './config/env';
import { connectDatabase } from './config/database';

async function main(): Promise<void> {
  const config = loadConfig();

  await connectDatabase(config.mongoUri);

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Picklesch API (${config.env}) listening on http://localhost:${config.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start Picklesch API:', error);
  process.exit(1);
});
