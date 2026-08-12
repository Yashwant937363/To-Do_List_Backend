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
import { checkDatabaseConnection } from "./config/database.js";
import { DublicateEmailError } from "./errors/DublicateEmailError.js";
import { globalErrorHandler } from "./handlers/globalErrorHandler.js";

const app = express();

app.use(express.json());

app.use(cors({}));

app.use(pinoHttp.default({ logger, redact: ["req.headers.authorization"] }));

app.use("/api/auth", authRouter);
app.use("/api/notes", noteRouter);

app.use(globalErrorHandler);

app.get("/status", (req: Request, res: Response) => {
  res.send("live");
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
