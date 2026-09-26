import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { serverConfig } from '../config';

let io: SocketIOServer;

export const setupSocket = (httpServer: Server) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: serverConfig.NODE_ENV === 'production'
                ? serverConfig.CLIENT_URL.split(',').map((origin) => origin.trim())
                : true,
            methods: ['GET', 'POST']
        }
    });
    return io;
};

export const getSocketIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
