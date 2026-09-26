import { Pool } from 'pg';
import { serverConfig } from '../config';

const isProduction = serverConfig.NODE_ENV === 'production';

export const pool = new Pool({
    connectionString: serverConfig.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
