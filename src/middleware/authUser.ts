import jwt from "jsonwebtoken";

import { configDotenv } from "dotenv";
import type { NextFunction, Request, Response } from "express";
import type { JWTPayload } from "../schemas/auth-schema.js";
import { verifyToken } from "../service/jwt-service.js";
configDotenv();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const authUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (token === undefined) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const result = verifyToken<JWTPayload>(token);
    res.locals = result;
    next();
  } catch (e) {
    return res.status(401).json({ message: "unauthorized" });
  }
};
