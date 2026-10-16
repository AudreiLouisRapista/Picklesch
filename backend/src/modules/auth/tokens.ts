import crypto from 'node:crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

export function createAccessToken(userId: string, secret: string, ttl: string | number): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: ttl as SignOptions['expiresIn'] });
}

export function readAccessToken(token: string, secret: string): { sub: string } {
  const decoded = jwt.verify(token, secret);

  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Access token payload is missing a subject');
  }

  return { sub: decoded.sub };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
