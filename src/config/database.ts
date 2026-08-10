import { Pool } from "pg";
import { env } from "./env.js";

export const pool = new Pool({
  host: env.db_host,
  port: env.db_port,
  user: env.db_user,
  password: env.db_password,
  database: env.db_name,
});
