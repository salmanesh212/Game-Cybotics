import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../config';
import { pool } from '../database/pool';
import { EventService } from '../services/event.service';
import { PlayerService } from '../services/player.service';
import { arrayToCsv } from '../utils/csv';
import { LeaderboardService } from '../services/leaderboard.service';
import { broadcastLeaderboard, broadcastStats } from '../websocket';

export const login = (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === serverConfig.ADMIN_SECRET) {
        const token = jwt.sign({ admin: true }, serverConfig.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
};

export const getPlayers = async (req: Request, res: Response) => {
    try {
        const players = await PlayerService.getAllPlayers();
        res.json(players);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getGames = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        const result = await pool.query(
            'SELECT g.id, g.player_id as "playerId", g.score, p.nickname, g.created_at as "createdAt" FROM games g JOIN players p ON g.player_id = p.id ORDER BY g.created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteGame = async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM games WHERE id = $1', [req.params.id]);
        LeaderboardService.invalidateCache();
        const event = await EventService.getActiveEvent();
        if (event) {
            broadcastLeaderboard(event.id);
            broadcastStats();
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await EventService.getEvents();
        res.json(events);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        if (!req.body.name) return res.status(400).json({ error: 'Name is required' });
        const event = await EventService.createEvent(req.body.name);
        LeaderboardService.invalidateCache();
        broadcastLeaderboard(event.id);
        broadcastStats();
        res.json(event);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const resetEvent = async (req: Request, res: Response) => {
    try {
        await EventService.resetEvent(req.params.id);
        LeaderboardService.invalidateCache();
        broadcastLeaderboard(req.params.id);
        broadcastStats();
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const exportCsv = async (req: Request, res: Response) => {
    try {
        const event = await EventService.getActiveEvent();
        if (!event) return res.status(400).json({ error: 'No active event' });

        const result = await pool.query(
            'SELECT g.id as game_id, g.score, g.avg_reaction_ms as avg_reaction, g.max_combo, p.nickname, g.created_at as played_at FROM games g JOIN players p ON g.player_id = p.id WHERE g.status = $1 AND g.event_id = $2',
            ['completed', event.id]
        );
        const csv = arrayToCsv(result.rows);
        res.header('Content-Type', 'text/csv');
        res.attachment(`export_${event.name}.csv`);
        res.send(csv);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getConfig = (req: Request, res: Response) => {
    res.json({
        DEFAULT_ROUNDS: serverConfig.DEFAULT_ROUNDS,
        DEFAULT_EVENT_NAME: serverConfig.DEFAULT_EVENT_NAME
    });
};

export const updateConfig = (req: Request, res: Response) => {
    res.json({ success: true, message: 'Config update via env vars only currently.' });
};

export const getDetailedStats = async (req: Request, res: Response) => {
    try {
        const event = await EventService.getActiveEvent();
        if (!event) return res.json({});

        const result = await pool.query(`
            SELECT 
                COUNT(id)::int as "totalGames",
                COALESCE(AVG(score), 0)::int as "avgScore",
                COALESCE(MAX(score), 0)::int as "maxScore",
                COALESCE(AVG(avg_reaction_ms), 0)::int as "avgGlobalReaction"
            FROM games WHERE status = 'completed' AND event_id = $1
        `, [event.id]);
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
