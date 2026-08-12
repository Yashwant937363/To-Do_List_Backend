import { Pool } from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const pool = new Pool({
  host: env.db_host,
  port: env.db_port,
  user: env.db_user,
  password: env.db_password,
  database: env.db_name,
});

export async function checkDatabaseConnection() {
  try {
    await pool.query("SELECT 1");

    logger.info("✅ PostgreSQL connected successfully");
  } catch (error) {
    logger.fatal(error, "❌ PostgreSQL connection failed:");
    throw error;
  }
}
