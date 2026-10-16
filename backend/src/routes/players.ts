import { Router } from 'express';
import { Types } from 'mongoose';

import { AuthenticatedRequest, requireAuth } from '../middleware/require-auth';
import { toPublicProfile } from '../modules/auth/service';
import { User } from '../models/User';

const playersRouter = Router();

playersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ error: { code: 'unauthenticated', message: 'Invalid session' } });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: { code: 'not_found', message: 'Player not found' } });
      return;
    }

    res.json({ user: toPublicProfile(user) });
  } catch (error) {
    next(error);
  }
});

export default playersRouter;
