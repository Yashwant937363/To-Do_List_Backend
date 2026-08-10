import express, { type Request, type Response } from "express";
import { env } from "./config/env.js";
import cors from "cors";

import authRouter from "./routes/auth-router.js";
import noteRouter from "./routes/note-router.js";

const app = express();

app.use(express.json());

app.use(cors({}));

app.use("/api/auth", authRouter);
app.use("/api/notes", noteRouter);

app.get("/status", (req: Request, res: Response) => {
  res.send("live");
});

app.listen(env.port, () => {
  console.log("server running");
});
