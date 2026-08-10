import { pool } from "../config/database.js";
import { DublicateEmailError } from "../errors/DublicateEmailError.js";

import { InternalServerError } from "../errors/InternalServerError.js";
import { UserNotExist } from "../errors/UserNotExistError.js";

import type {
  JWTPayload,
  LoginResponse,
  RegisterReq,
} from "../schemas/auth-schema.js";
import type { BaseError } from "../schemas/base-schema.js";
import type User from "../schemas/user-schema.js";
import { getHash } from "./bcrypt-service.js";
import { generateToken } from "./jwt-service.js";

export const createUser = async ({
  username,
  email,
  password,
}: RegisterReq): Promise<LoginResponse> => {
  try {
    const passwordHash = await getHash(password);
    const query = `
            INSERT INTO users(username, email, password) VALUES($1,$2,$3) RETURNING id
        `;

    const result = await pool.query(query, [username, email, passwordHash]);
    const authtoken = generateToken<JWTPayload>(result.rows[0].id);
    return {
      status: 201,
      message: "user created",
      data: {
        authtoken,
      },
    };
  } catch (e: any) {
    console.log(e);
    if (e.code === "23505") {
      throw new DublicateEmailError();
    }
    throw new InternalServerError();
  }
};

export const getUser = async ({ email }: { email: string }): Promise<User> => {
  try {
    const query = `
            SELECT * FROM users WHERE email=$1
        `;

    const result = await pool.query(query, [email]);
    if (result.rows.length <= 0) {
      throw new UserNotExist();
    }
    return result.rows[0] as User;
  } catch (e: any) {
    console.log(e);
    throw new InternalServerError();
  }
};
export const getUserById = async ({ id }: { id: number }): Promise<User> => {
  try {
    const query = `
            SELECT * FROM users WHERE id=$1
        `;

    const result = await pool.query(query, [id]);
    if (result.rows.length <= 0) {
      throw new UserNotExist();
    }
    return result.rows[0] as User;
  } catch (e: any) {
    console.log(e);
    throw new InternalServerError();
  }
};
