import { NextFunction, Request, Response, Router } from 'express';

import { AppError } from '../errors';
import { AuthenticatedRequest, requireAuth } from '../middleware/require-auth';
import {
  checkInToSession,
  createSession,
  getSession,
  runFormation,
  toPublicSession,
} from '../modules/sessions/service';
import { emitCourtAssignments } from '../realtime';

const sessionsRouter = Router();

function currentUserId(req: unknown): string {
  const { userId } = req as AuthenticatedRequest;

  if (!userId) {
    throw new AppError(401, 'unauthenticated', 'Invalid session');
  }

  return userId;
}

function route(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

sessionsRouter.post(
  '/',
  requireAuth,
  route(async (req, res) => {
    const viewerId = currentUserId(req);
    const session = await createSession(req.body, viewerId);

    res.status(201).json({ session: await toPublicSession(session, viewerId) });
  }),
);

sessionsRouter.post(
  '/:id/checkin',
  requireAuth,
  route(async (req, res) => {
    const viewerId = currentUserId(req);
    const session = await checkInToSession({
      sessionId: req.params.id,
      playerId: viewerId,
      qrCode: req.body?.qrCode,
    });

    res.status(200).json({ session: await toPublicSession(session, viewerId) });
  }),
);

sessionsRouter.get(
  '/:id',
  requireAuth,
  route(async (req, res) => {
    const viewerId = currentUserId(req);
    const session = await getSession(req.params.id);

    res.status(200).json({ session: await toPublicSession(session, viewerId) });
  }),
);

sessionsRouter.post(
  '/:id/formation',
  requireAuth,
  route(async (req, res) => {
    const viewerId = currentUserId(req);
    const session = await runFormation({ sessionId: req.params.id });
    const view = await toPublicSession(session, viewerId);

    emitCourtAssignments(String(session._id), { type: 'court:assigned', session: view });
    res.status(200).json({ session: view });
  }),
);

export default sessionsRouter;
