import { Router } from 'express';
import mongoose from 'mongoose';

import { getEnvProfile } from '../config/env';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    env: getEnvProfile(),
    db: {
      state: connected ? 'connected' : 'disconnected',
      name: mongoose.connection.name || null,
    },
  });
});

export default healthRouter;
