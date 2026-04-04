import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let trackingSocket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      autoConnect: false,
      transports: ['websocket'],
    })
  }
  return socket
}

export function getTrackingSocket(): Socket {
  if (!trackingSocket) {
    trackingSocket = io(
      `${process.env.NEXT_PUBLIC_API_URL!}/tracking`,
      {
        autoConnect: false,
        transports: ['websocket'],
      }
    )
  }
  return trackingSocket
}

export function connectSocket(): void {
  const s = getSocket()
  if (!s.connected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      s.auth = { token }
    }
    s.connect()
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect()
  if (trackingSocket?.connected) trackingSocket.disconnect()
}
