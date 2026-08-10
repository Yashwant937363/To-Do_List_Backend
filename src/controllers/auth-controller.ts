import type { Request, Response } from "express";
import { createUser, getUser, getUserById } from "../service/user-service.js";
import { InternalServerError } from "../errors/InternalServerError.js";
import { DublicateEmailError } from "../errors/DublicateEmailError.js";
import type { JWTPayload, LoginReq } from "../schemas/auth-schema.js";
import { compareHash, getHash } from "../service/bcrypt-service.js";
import { generateToken } from "../service/jwt-service.js";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const response = await createUser(req.body);

    return res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    console.log("Something went wrong", e);
    if (e instanceof DublicateEmailError || e instanceof InternalServerError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
  }
};

export const loginUser = async (
  req: Request<{}, {}, LoginReq>,
  res: Response,
) => {
  try {
    const response = await getUser({ email: req.body.email });

    const isValid = await compareHash(response.password, req.body.password);
    if (!isValid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authtoken = generateToken<JWTPayload>({ id: response.id });

    return res.status(200).json({
      message: "User logged in",
      data: {
        authtoken,
        username: response.username,
      },
    });
  } catch (e) {
    console.log("Something went wrong", e);
    if (e instanceof DublicateEmailError || e instanceof InternalServerError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
  }
};

export const loginUserByToken = async (
  req: Request,
  res: Response<any, JWTPayload>,
) => {
  try {
    const response = await getUserById({ id: res.locals.id });

    const authtoken = generateToken<JWTPayload>({ id: response.id });

    return res.status(200).json({
      message: "User logged in",
      data: {
        email: response.email,
        username: response.username,
        authtoken,
      },
    });
  } catch (e) {
    console.log("Something went wrong", e);
    if (e instanceof DublicateEmailError || e instanceof InternalServerError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
  }
};
