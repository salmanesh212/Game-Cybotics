import { pool } from '../database/pool';

const cache = new Map<string, { data: any, expiresAt: number }>();

export class LeaderboardService {
    static async getTopScores(eventId: string, limit = 10) {
        const cacheKey = `top_${eventId}_${limit}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        
        const res = await pool.query(`
            SELECT g.id, g.score as "totalScore", g.max_combo as "maxCombo", g.avg_reaction_ms as "avgReaction", p.nickname, p.id as player_id
            FROM games g
            JOIN players p ON g.player_id = p.id
            WHERE g.event_id = $1 AND g.status = 'completed'
            ORDER BY g.score DESC, g.avg_reaction_ms ASC, g.finished_at ASC
            LIMIT $2
        `, [eventId, limit]);
        
        cache.set(cacheKey, { data: res.rows, expiresAt: Date.now() + 2000 });
        return res.rows;
    }
    
    static async getPlayerRank(eventId: string, playerId: string) {
        const res = await pool.query(`
            WITH ranked AS (
                SELECT player_id, score,
                RANK() OVER(ORDER BY score DESC, avg_reaction_ms ASC, finished_at ASC) as rnk
                FROM games
                WHERE event_id = $1 AND status = 'completed'
            )
            SELECT rnk FROM ranked WHERE player_id = $2
            ORDER BY score DESC LIMIT 1
        `, [eventId, playerId]);
        
        return res.rows[0] ? parseInt(res.rows[0].rnk) : null;
    }

    static async getGameRank(eventId: string, gameId: string) {
        const res = await pool.query(`
            SELECT rank FROM (
                SELECT id, ROW_NUMBER() OVER(ORDER BY score DESC, avg_reaction_ms ASC, finished_at ASC) AS rank
                FROM games
                WHERE event_id = $1 AND status = 'completed'
            ) ranked WHERE id = $2
        `, [eventId, gameId]);
        return res.rows[0] ? Number(res.rows[0].rank) : null;
    }
    
    static async getScoresAroundPlayer(eventId: string, playerId: string, range = 2) {
        const rank = await this.getPlayerRank(eventId, playerId);
        if (!rank) return [];
        
        const res = await pool.query(`
            WITH ranked AS (
                SELECT g.id, g.score as "totalScore", g.max_combo as "maxCombo", g.avg_reaction_ms as "avgReaction", p.nickname, p.id as player_id,
                RANK() OVER(ORDER BY g.score DESC, g.avg_reaction_ms ASC, g.finished_at ASC) as rnk
                FROM games g
                JOIN players p ON g.player_id = p.id
                WHERE g.event_id = $1 AND g.status = 'completed'
            )
            SELECT * FROM ranked WHERE rnk >= $2 AND rnk <= $3
            ORDER BY rnk ASC
        `, [eventId, Math.max(1, rank - range), rank + range]);
        
        return res.rows;
    }
    
    static async isNewRecord(eventId: string, score: number) {
        const top = await this.getTopScores(eventId, 1);
        if (top.length === 0) return true;
        return score > top[0].totalScore;
    }
    
    static invalidateCache() {
        cache.clear();
    }
}
