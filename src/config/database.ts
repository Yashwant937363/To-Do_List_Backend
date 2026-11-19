import { Pool, type PoolConfig } from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

const poolConfig: PoolConfig = env.database_url
  ? {
      connectionString: env.database_url,
      ssl: env.database_url.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    }
  : {
      host: env.db_host,
      port: env.db_port,
      user: env.db_user,
      password: env.db_password,
      database: env.db_name,
    };

export const pool = new Pool(poolConfig);

export async function checkDatabaseConnection() {
  try {
    await pool.query("SELECT 1");

    logger.info("✅ PostgreSQL connected successfully");
  } catch (error) {
    logger.fatal(error, "❌ PostgreSQL connection failed:");
    throw error;
  }
}
