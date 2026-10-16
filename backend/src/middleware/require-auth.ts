import { NextFunction, Request, Response } from 'express';

import { loadConfig } from '../config/env';
import { readAccessToken } from '../modules/auth/tokens';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

function unauthenticated(res: Response, message: string): void {
  res.status(401).json({ error: { code: 'unauthenticated', message } });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.header('authorization') ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    unauthenticated(res, 'Missing bearer token');
    return;
  }

  try {
    const { sub } = readAccessToken(token, loadConfig().jwtSecret);
    (req as AuthenticatedRequest).userId = sub;
    next();
  } catch {
    unauthenticated(res, 'Invalid or expired token');
  }
}
