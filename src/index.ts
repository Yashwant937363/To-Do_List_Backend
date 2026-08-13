import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { env } from "./config/env.js";
import cors from "cors";

import authRouter from "./routes/auth-router.js";
import noteRouter from "./routes/note-router.js";
import { logger } from "./config/logger.js";
import pinoHttp from "pino-http";
import { checkDatabaseConnection, pool } from "./config/database.js";
import { DublicateEmailError } from "./errors/DublicateEmailError.js";
import { globalErrorHandler } from "./handlers/globalErrorHandler.js";
import { register } from "./config/metrics.js";
import { metricsMiddleware } from "./middleware/matricsMiddleware.js";

const app = express();

app.use(express.json());

app.use(cors({}));

app.use(pinoHttp.default({ logger, redact: ["req.headers.authorization"] }));

app.use(metricsMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/notes", noteRouter);

app.use(globalErrorHandler);

app.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ready",
    });
  } catch (error) {
    req.log.error(error, "Readiness check failed");

    res.status(503).json({
      status: "not_ready",
    });
  }
});

app.get("/metrics", async (req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);

  res.end(await register.metrics());
});

async function startServer() {
  try {
    await checkDatabaseConnection();

    app.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    logger.fatal(error, "❌ Server startup failed");

    process.exit(1);
  }
}

await startServer();
