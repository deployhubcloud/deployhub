import { io } from 'socket.io-client'
import { WS_URL } from '../api/ApiUrl'

let socket = null

export function getSocket() {
    if (!socket) {
        socket = io(WS_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 2000,
            autoConnect: false,
        })
    }

    socket.on("connect", () => {
        console.log("Connected", socket.id);
    });

    socket.on("connect_error", (err) => {
        console.log(err.message);
        console.log(err);
    });
    return socket
}

export function connectSocket() {
    const s = getSocket()
    if (!s.connected) s.connect()
    return s
}

export function disconnectSocket() {
    if (socket?.connected) socket.disconnect()
}