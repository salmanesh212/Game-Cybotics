import { Request, Response } from 'express';
import { PlayerService } from '../services/player.service';
import { GameService } from '../services/game.service';
import { EventService } from '../services/event.service';
import { validateNickname, validateGameId, validateRoundData } from '../middleware/validation';
import { broadcastLeaderboard, broadcastNewRecord, broadcastStats } from '../websocket/index';
import { LeaderboardService } from '../services/leaderboard.service';
import { pool } from '../database/pool';

export const registerPlayer = async (req: Request, res: Response) => {
    try {
        const nickname = validateNickname(req.body.nickname);
        const player = await PlayerService.createPlayer(nickname);
        res.json({ playerId: player.id, token: player.token });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const startGame = async (req: Request, res: Response) => {
    try {
        const token = req.headers['x-player-token'] as string;
        if (!token) return res.status(401).json({ error: 'Token required' });
        
        const player = await PlayerService.getPlayerByToken(token);
        if (!player) return res.status(401).json({ error: 'Invalid token' });
        
        const event = await EventService.getActiveEvent();
        if (!event) return res.status(400).json({ error: 'No active event' });
        
        const game = await GameService.startGame(player.id, event.id);
        res.json(game);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const submitRound = async (req: Request, res: Response) => {
    try {
        validateGameId(req.params.id);
        validateRoundData(req.body);
        
        // Require token for security
        const token = req.headers['x-player-token'] as string;
        if (!token) return res.status(401).json({ error: 'Token required' });
        const player = await PlayerService.getPlayerByToken(token);
        if (!player) return res.status(401).json({ error: 'Invalid token' });

        const state = await GameService.getGameState(req.params.id);
        if (!state) return res.status(404).json({ error: 'Game not found' });
        if (state.playerId !== player.id) return res.status(403).json({ error: 'Not your game' });

        const result = await GameService.submitRound(
            req.params.id,
            req.body.roundNumber,
            req.body.selectedValue
        );
        
        if (req.body.roundNumber >= state.totalRounds) {
            return res.json({ ...result, completed: true });
        } else {
            const nextRound = await GameService.getRoundConfig(req.params.id, req.body.roundNumber + 1);
            
            const roundsRes = await pool.query('SELECT SUM(score_earned)::int as total FROM game_rounds WHERE game_id = $1 AND round_number <= $2', [req.params.id, req.body.roundNumber]);
            const currentScore = roundsRes.rows[0].total || 0;
            
            return res.json({ ...result, completed: false, nextRound, currentScore });
        }
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const finishGame = async (req: Request, res: Response) => {
    try {
        validateGameId(req.params.id);
        
        const token = req.headers['x-player-token'] as string;
        if (!token) return res.status(401).json({ error: 'Token required' });
        const player = await PlayerService.getPlayerByToken(token);
        if (!player) return res.status(401).json({ error: 'Invalid token' });
        
        const state = await GameService.getGameState(req.params.id);
        if (!state) return res.status(404).json({ error: 'Game not found' });
        if (state.playerId !== player.id) return res.status(403).json({ error: 'Not your game' });
        
        const eventId = state.eventId;
        const wasCompleted = state.status === 'completed';
        
        const stats = await GameService.finishGame(req.params.id);
        LeaderboardService.invalidateCache();
        
        const rank = await LeaderboardService.getGameRank(eventId, req.params.id);
        
        const topScores = await LeaderboardService.getTopScores(eventId, 1);
        if (!wasCompleted && topScores.length > 0 && topScores[0].id === req.params.id) {
            broadcastNewRecord(player.nickname, stats.totalScore);
        }

        if (!wasCompleted) {
            broadcastLeaderboard(eventId);
            broadcastStats();
        }
        
        res.json({ ...stats, rank });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
