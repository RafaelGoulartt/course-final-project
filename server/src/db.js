import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const baseConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.POSTGRES_HOST || "localhost",
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
    };

if (baseConfig.connectionString?.includes('[YOUR-PASSWORD]')) {
  throw new Error('DATABASE_URL ainda usa [YOUR-PASSWORD]. Substitua pelo password real do Supabase Pooler.');
}

const pool = new Pool({
  ...baseConfig,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function getPool() {
  return pool;
}
