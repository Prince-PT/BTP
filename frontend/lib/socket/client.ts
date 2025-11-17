import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const initSocket = (userId: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
    // Join user room with userId and role
    socket?.emit('user:join', { userId, role: 'user' });
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event emitters
export const emitDriverLocation = (driverId: string, location: { lat: number; lng: number }) => {
  socket?.emit('driver:location', { driverId, location });
};

// Event listeners
export const onDriverLocationUpdate = (callback: (data: unknown) => void) => {
  socket?.on('driver:location:update', callback);
};

export const onRideAccepted = (callback: (data: unknown) => void) => {
  socket?.on('ride:accepted', callback);
};

export const onRideRejected = (callback: (data: unknown) => void) => {
  socket?.on('ride:rejected', callback);
};

export const onNewRideRequest = (callback: (data: unknown) => void) => {
  socket?.on('ride:new-request', callback);
};

export const onNewPassengerRequest = (callback: (data: unknown) => void) => {
  socket?.on('ride:new-passenger-request', callback);
};

export const onFareUpdated = (callback: (data: unknown) => void) => {
  socket?.on('ride:fare-updated', callback);
};

export const onRidePickedUp = (callback: (data: unknown) => void) => {
  socket?.on('ride:picked-up', callback);
};

export const onRideCompleted = (callback: (data: unknown) => void) => {
  socket?.on('ride:completed', callback);
};
