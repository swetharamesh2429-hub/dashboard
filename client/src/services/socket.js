import { io } from 'socket.io-client'

let socket

export function connectRealtime(session, handlers = {}) {
  if (socket) socket.disconnect()
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
    auth: { token: session?.token },
  })
  Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler))
  return () => { socket?.disconnect(); socket = undefined }
}
