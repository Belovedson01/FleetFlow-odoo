import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { prisma } from './prisma/client';
import { setSocketServer } from './utils/socket';

const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.emit('realtime:connected', { at: new Date().toISOString() });
});

setSocketServer(io);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`FleetFlow API running on port ${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
