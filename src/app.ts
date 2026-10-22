import express, { type Request, type Response } from "express";
import cors from "cors";

import authRouter from "./routes/auth-router.js";
import noteRouter from "./routes/note-router.js";
import pinoHttp from "pino-http";

import { globalErrorHandler } from "./handlers/globalErrorHandler.js";
import { register } from "./config/metrics.js";
import { metricsMiddleware } from "./middleware/matricsMiddleware.js";
import { logger } from "./config/logger.js";
import { checkDatabaseConnection } from "./config/database.js";

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
    await checkDatabaseConnection();

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

export default app;
