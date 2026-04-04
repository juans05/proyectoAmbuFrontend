import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let trackingSocket: Socket | null = null
let trackingSocketToken: string | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      autoConnect: false,
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    })
  }
  return socket
}

/**
 * Devuelve (o crea) el socket de tracking.
 * Si se pasa un token diferente al usado anteriormente, destruye el singleton
 * y crea uno nuevo para que el handshake incluya las credenciales correctas.
 */
export function getTrackingSocket(token?: string | null): Socket {
  const resolvedToken =
    token ??
    (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null)

  // Recrear si el token cambió (ej. nuevo login) o aún no existe
  if (trackingSocket && resolvedToken !== trackingSocketToken) {
    if (trackingSocket.connected) trackingSocket.disconnect()
    trackingSocket = null
    trackingSocketToken = null
  }

  if (!trackingSocket) {
    trackingSocketToken = resolvedToken
    trackingSocket = io(`${process.env.NEXT_PUBLIC_API_URL!}/tracking`, {
      autoConnect: false,
      transports: ['websocket'],
      auth: resolvedToken ? { token: resolvedToken } : undefined,
    })
  }

  return trackingSocket
}

export function connectSocket(): void {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const s = getSocket()
  if (!s.connected) {
    if (token) s.auth = { token }
    s.connect()
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect()
  if (trackingSocket?.connected) trackingSocket.disconnect()
  // Limpiar singletons para que el próximo login use token fresco
  socket = null
  trackingSocket = null
  trackingSocketToken = null
}

