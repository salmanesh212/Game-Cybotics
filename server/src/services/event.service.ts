import { pool } from '../database/pool';
import { serverConfig } from '../config';

export class EventService {
    static async getActiveEvent() {
        let res = await pool.query('SELECT id, name, is_active as "isActive", created_at as "createdAt" FROM events WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length === 0) {
            res = await pool.query(
                'INSERT INTO events (name, is_active) VALUES ($1, TRUE) RETURNING id, name, is_active as "isActive", created_at as "createdAt"',
                [serverConfig.DEFAULT_EVENT_NAME]
            );
        }
        return res.rows[0];
    }
    
    static async createEvent(name: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE events SET is_active = FALSE');
            const res = await client.query(
                'INSERT INTO events (name, is_active) VALUES ($1, TRUE) RETURNING id, name, is_active as "isActive", created_at as "createdAt"',
                [name]
            );
            await client.query('COMMIT');
            return res.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
    
    static async getEvents() {
        const res = await pool.query('SELECT id, name, is_active as "isActive", created_at as "createdAt" FROM events ORDER BY created_at DESC');
        return res.rows;
    }
    
    static async resetEvent(eventId: string) {
        await pool.query("UPDATE games SET status = 'archived' WHERE event_id = $1", [eventId]);
    }
}
