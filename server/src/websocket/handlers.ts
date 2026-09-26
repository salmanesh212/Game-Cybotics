import { getSocketIo } from './socket';
import { LeaderboardService } from '../services/leaderboard.service';
import { pool } from '../database/pool';
import { logger } from '../utils/logger';

let connectedCount = 0;

export const initHandlers = () => {
    const io = getSocketIo();
    
    io.on('connection', (socket) => {
        connectedCount++;
        socket.join('arena');
        broadcastStats();
        
        socket.on('disconnect', () => {
            connectedCount--;
            broadcastStats();
        });
    });
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
        const result = await pool.query("SELECT COUNT(id) as c FROM games WHERE status = 'completed'");
        getSocketIo().to('arena').emit('stats:update', {
            connectedClients: connectedCount,
            totalGames: result.rows[0].c
        });
    } catch (e) {
        logger.error('Error broadcasting stats:', e);
    }
};

export const broadcastGameEvent = (type: string, data: any) => {
    getSocketIo().to('arena').emit('game:event', { type, data });
};
