import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

import { loadConfig } from '../config/env';
import { readAccessToken } from '../modules/auth/tokens';

let io: Server | null = null;

export function createRealtime(server: HttpServer): Server {
  io = new Server(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    try {
      readAccessToken(token, loadConfig().jwtSecret);
      next();
    } catch {
      next(new Error('unauthenticated'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('session:join', (sessionId: unknown) => {
      if (typeof sessionId === 'string') {
        void socket.join(`session:${sessionId}`);
      }
    });

    socket.on('session:leave', (sessionId: unknown) => {
      if (typeof sessionId === 'string') {
        void socket.leave(`session:${sessionId}`);
      }
    });
  });

  return io;
}

export function emitCourtAssignments(sessionId: string, payload: unknown): void {
  io?.to(`session:${sessionId}`).emit('court:assigned', payload);
}
