import { Socket, io } from 'socket.io-client';

import { DEFAULT_BASE_URL, socketBaseUrl } from '../api/client';

export function createSessionSocket(token: string, baseUrl: string = DEFAULT_BASE_URL): Socket {
  return io(socketBaseUrl(baseUrl), {
    auth: { token },
    transports: ['websocket'],
  });
}
