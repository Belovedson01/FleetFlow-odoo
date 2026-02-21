import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const useRealtime = () => {
  const token = useAuthStore((s) => s.token);
  const bump = useRealtimeStore((s) => s.bump);

  useEffect(() => {
    if (!token) {
      return;
    }
    const socket = io(socketUrl, {
      transports: ['websocket']
    });

    const onRefresh = () => bump();
    socket.on('dashboard:refresh', onRefresh);
    socket.on('vehicle:updated', onRefresh);
    socket.on('trip:updated', onRefresh);
    socket.on('driver:updated', onRefresh);
    socket.on('fuel-log:updated', onRefresh);
    socket.on('service-log:updated', onRefresh);

    return () => {
      socket.off('dashboard:refresh', onRefresh);
      socket.off('vehicle:updated', onRefresh);
      socket.off('trip:updated', onRefresh);
      socket.off('driver:updated', onRefresh);
      socket.off('fuel-log:updated', onRefresh);
      socket.off('service-log:updated', onRefresh);
      socket.disconnect();
    };
  }, [bump, token]);
};
