import type { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

export const emitRealtime = (event: string, payload: unknown) => {
  if (!io) {
    return;
  }
  io.emit(event, payload);
};
