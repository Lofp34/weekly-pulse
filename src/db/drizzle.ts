import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@host/db';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
