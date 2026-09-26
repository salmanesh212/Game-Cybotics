import { Pool } from 'pg';
import { DataType, newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { serverConfig } from '../config';

const isProduction = serverConfig.NODE_ENV === 'production';
const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
memoryDb.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => randomUUID()
});
const memoryPg = memoryDb.adapters.createPg();

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
