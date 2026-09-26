import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { serverConfig } from '../config';
import { LeaderboardService } from '../services/leaderboard.service';
import { pool } from '../database/pool';
import { logger } from '../utils/logger';

let io: SocketIOServer;
let connectedCount = 0;

export const setupSocket = (httpServer: Server) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: serverConfig.CLIENT_URL,
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        connectedCount++;
        socket.join('arena');
        broadcastStats();
        
        socket.on('disconnect', () => {
            connectedCount--;
            broadcastStats();
        });
    });

    return io;
};

export const getSocketIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const broadcastLeaderboard = async (eventId: string) => {
    try {
        const topScores = await LeaderboardService.getTopScores(eventId);
        getSocketIo().to('arena').emit('leaderboard:update', topScores);
    } catch (e) {
        logger.error('Error broadcasting leaderboard:', e);
    }
};

export const broadcastNewRecord = (playerName: string, score: number) => {
    getSocketIo().to('arena').emit('new-record', { playerName, score });
};

export const broadcastStats = async () => {
    try {
        const result = await pool.query("SELECT COUNT(id)::int as c FROM games WHERE status = 'completed'");
        getSocketIo().to('arena').emit('stats:update', {
            connectedClients: connectedCount,
            totalGames: result.rows[0].c
        });
    } catch (e) {
        logger.error('Error broadcasting stats:', e);
    }
};
