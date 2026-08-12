import dotenv from "dotenv";
dotenv.config();

interface ENV {
  port: number;
  jwt_secret: string;
  db_host: string;
  db_port: number;
  db_user: string;
  db_password: string;
  db_name: string;
  log_level: string;
}

export const env: ENV = {
  port: Number(process.env.PORT) || 5000,
  jwt_secret: process.env.JWT_SECRET_KEY || "",
  db_host: process.env.DB_HOST || "",
  db_port: Number(process.env.DB_PORT),
  db_user: process.env.DB_USER || "",
  db_password: process.env.DB_PASSWORD || "",
  db_name: process.env.DB_NAME || "",
  log_level: process.env.LOG_LEVEL || "debug",
};
