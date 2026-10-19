import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
