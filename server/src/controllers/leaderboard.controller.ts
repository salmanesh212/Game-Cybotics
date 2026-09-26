import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { EventService } from '../services/event.service';

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const event = await EventService.getActiveEvent();
        if (!event) return res.json([]);
        const top = await LeaderboardService.getTopScores(event.id);
        res.json(top);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getPlayerLeaderboard = async (req: Request, res: Response) => {
    try {
        const event = await EventService.getActiveEvent();
        if (!event) return res.json({});
        const around = await LeaderboardService.getScoresAroundPlayer(event.id, req.params.playerId);
        const rank = await LeaderboardService.getPlayerRank(event.id, req.params.playerId);
        res.json({ rank, surrounding: around });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
