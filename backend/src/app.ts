import express, { Express, NextFunction, Request, Response } from 'express';

import { AuthError } from './modules/auth/errors';
import authRouter from './routes/auth';
import healthRouter from './routes/health';
import playersRouter from './routes/players';

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/players', playersRouter);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }

    console.error('Unhandled error:', error);
    res.status(500).json({ error: { code: 'internal_error', message: 'Unexpected server error' } });
  });

  return app;
}
