import { io } from 'socket.io-client'

let socket

export function connectRealtime(organizationId, handlers = {}) {
  if (socket) socket.disconnect()
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { transports: ['websocket', 'polling'] })
  socket.on('connect', () => socket.emit('join', organizationId))
  Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler))
  return () => { socket?.disconnect(); socket = undefined }
}
