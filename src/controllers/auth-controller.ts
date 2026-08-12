import type { NextFunction, Request, Response } from "express";
import { createUser, getUser, getUserById } from "../service/user-service.js";
import { InternalServerError } from "../errors/InternalServerError.js";
import { DublicateEmailError } from "../errors/DublicateEmailError.js";
import type { JWTPayload, LoginReq } from "../schemas/auth-schema.js";
import { compareHash, getHash } from "../service/bcrypt-service.js";
import { generateToken } from "../service/jwt-service.js";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await createUser(req.body);
    req.log.info(
      {
        user_id: response.user_id,
      },
      "User registered successfully",
    );
    return res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    next(e);
  }
};

export const loginUser = async (
  req: Request<{}, {}, LoginReq>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await getUser({ email: req.body.email });

    const isValid = await compareHash(response.password, req.body.password);
    if (!isValid) {
      req.log.warn(
        {
          user_id: response.id,
        },
        "Unauthorized access attempt: Invalid credentials",
      );
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authtoken = generateToken<JWTPayload>({ id: response.id });
    req.log.info(
      {
        user_id: response.id,
      },
      "User logged in successfully",
    );
    return res.status(200).json({
      message: "User logged in",
      data: {
        authtoken,
        username: response.username,
      },
    });
  } catch (e: any) {
    next(e);
  }
};

export const loginUserByToken = async (
  req: Request,
  res: Response<any, JWTPayload>,
  next: NextFunction,
) => {
  try {
    const response = await getUserById({ id: res.locals.id });

    const authtoken = generateToken<JWTPayload>({ id: response.id });
    req.log.info(
      {
        user_id: res.locals.id,
      },
      "User logged in successfully by token",
    );

    return res.status(200).json({
      message: "User logged in",
      data: {
        email: response.email,
        username: response.username,
        authtoken,
      },
    });
  } catch (e: any) {
    next(e);
  }
};
