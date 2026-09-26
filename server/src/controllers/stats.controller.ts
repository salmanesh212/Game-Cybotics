import { Request, Response } from 'express';
import { pool } from '../database/pool';
import { EventService } from '../services/event.service';

export const getStats = async (req: Request, res: Response) => {
    try {
        const event = await EventService.getActiveEvent();
        if (!event) return res.json({});
        const result = await pool.query(`
            SELECT 
                COUNT(DISTINCT player_id)::int as "playerCount",
                COUNT(id)::int as "gameCount",
                COALESCE(MAX(score), 0)::int as "highScore"
            FROM games WHERE event_id = $1 AND status = 'completed'
        `, [event.id]);
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
