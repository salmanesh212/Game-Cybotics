import { config } from 'dotenv';
import path from 'path';

// Load .env from project root if it exists
config({ path: path.resolve(process.cwd(), '../.env') });
// Also try local .env
config();

export const serverConfig = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cybotics_tap',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    PUBLIC_GAME_URL: process.env.PUBLIC_GAME_URL || 'http://localhost:5173',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-prod',
    ADMIN_SECRET: process.env.ADMIN_SECRET || 'cybotics-admin-2026',
    DEFAULT_ROUNDS: parseInt(process.env.DEFAULT_ROUNDS || '20', 10),
    DEFAULT_EVENT_NAME: process.env.DEFAULT_EVENT_NAME || 'CYBOTICS FAIR 2026',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

if (serverConfig.NODE_ENV === 'production' && (!process.env.ADMIN_SECRET || !process.env.JWT_SECRET)) {
    throw new Error('ADMIN_SECRET and JWT_SECRET must be set in production.');
}
