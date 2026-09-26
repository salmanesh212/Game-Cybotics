import { Pool } from 'pg';
import { newDb } from 'pg-mem';
import { serverConfig } from '../config';

const isProduction = serverConfig.NODE_ENV === 'production';
const memoryPg = newDb({ autoCreateForeignKeyIndices: true }).adapters.createPg();

const postgresPool = !serverConfig.USE_IN_MEMORY_DB && serverConfig.DATABASE_URL
    ? new Pool({
        connectionString: serverConfig.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false
    })
    : new memoryPg.Pool();

export const pool = postgresPool;

pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
