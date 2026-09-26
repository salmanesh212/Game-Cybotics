import { pool } from '../database/pool';
import crypto from 'crypto';

export class PlayerService {
    static async createPlayer(nickname: string) {
        const token = crypto.randomBytes(32).toString('hex');
        const res = await pool.query(
            'INSERT INTO players (nickname, token) VALUES ($1, $2) RETURNING id, nickname, token, created_at as "createdAt"',
            [nickname, token]
        );
        return res.rows[0];
    }
    
    static async getPlayerByToken(token: string) {
        const res = await pool.query('SELECT id, nickname, token, created_at as "createdAt" FROM players WHERE token = $1', [token]);
        return res.rows[0];
    }
    
    static async getPlayerById(id: string) {
        const res = await pool.query('SELECT id, nickname, token, created_at as "createdAt" FROM players WHERE id = $1', [id]);
        return res.rows[0];
    }
    
    static async getAllPlayers() {
        const res = await pool.query(`
            SELECT p.id, p.nickname, p.created_at as "createdAt", COUNT(g.id)::int as "gameCount"
            FROM players p
            LEFT JOIN games g ON p.id = g.player_id
            GROUP BY p.id, p.nickname, p.created_at
            ORDER BY p.created_at DESC
        `);
        return res.rows;
    }
}
