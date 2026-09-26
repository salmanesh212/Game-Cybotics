import { pool } from './pool';
import { logger } from '../utils/logger';
import { serverConfig } from '../config';

const migrations = [
    {
        name: '001_initial',
        sql: `
            CREATE TABLE IF NOT EXISTS events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS players (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nickname VARCHAR(16) NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS games (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                player_id UUID REFERENCES players(id) ON DELETE CASCADE,
                event_id UUID REFERENCES events(id) ON DELETE CASCADE,
                seed VARCHAR(255) NOT NULL,
                total_rounds INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                score INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                errors INTEGER DEFAULT 0,
                avg_reaction_ms INTEGER DEFAULT 0,
                best_reaction_ms INTEGER DEFAULT 0,
                submitted BOOLEAN DEFAULT FALSE,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                finished_at TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE IF NOT EXISTS game_rounds (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                game_id UUID REFERENCES games(id) ON DELETE CASCADE,
                round_number INTEGER NOT NULL,
                target_type VARCHAR(50) NOT NULL,
                target_value VARCHAR(50) NOT NULL,
                grid_data JSONB NOT NULL,
                selected_value VARCHAR(50),
                is_correct BOOLEAN,
                reaction_time_ms INTEGER,
                score_earned INTEGER,
                combo_at INTEGER DEFAULT 0,
                answered_at TIMESTAMP WITH TIME ZONE,
                presented_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(game_id, round_number)
            );

            ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS presented_at TIMESTAMP WITH TIME ZONE;

            CREATE INDEX IF NOT EXISTS idx_games_event_status ON games(event_id, status);
            CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_id);
            CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
        `
    }
];

export async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create migrations table
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const executedRes = await client.query('SELECT name FROM migrations');
        const executed = new Set(executedRes.rows.map(r => r.name));

        for (const migration of migrations) {
            if (!executed.has(migration.name)) {
                logger.info(`Running migration: ${migration.name}`);
                await client.query(migration.sql);
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
            }
        }

        // Ensure default event exists
        const eventRes = await client.query('SELECT * FROM events WHERE is_active = TRUE');
        if (eventRes.rows.length === 0) {
            logger.info('No active event found. Creating default event.');
            await client.query('INSERT INTO events (name, is_active) VALUES ($1, TRUE)', [serverConfig.DEFAULT_EVENT_NAME]);
        }

        await client.query('COMMIT');
        logger.info('Database migrations completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Migration failed:', e);
        throw e;
    } finally {
        client.release();
    }
}
