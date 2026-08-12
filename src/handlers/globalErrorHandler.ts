import type { NextFunction, Request, Response } from "express";
import { DublicateEmailError } from "../errors/DublicateEmailError.js";
import { UserNotExist } from "../errors/UserNotExistError.js";
import { NoteNotFound } from "../errors/NoteNotFound.js";
import { maskEmail } from "../utils/maskEmail.js";

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof DublicateEmailError) {
    req.log.warn(
      {
        email: maskEmail(req.body.email),
      },
      "Duplicate email error",
    );
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof UserNotExist) {
    req.log.warn({ details: error.data }, "User not found error");
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof NoteNotFound) {
    req.log.warn({ details: error.data }, "Note not found error");
    return res.status(error.statusCode).json({ message: error.message });
  }

  req.log.error(error, "Unhandled error");
  res.status(500).json({ message: "Internal Server Error" });
};
