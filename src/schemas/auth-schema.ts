import * as z from "zod";
import type { BaseResponse } from "./base-schema.js";

export const registerReqSchema = z.object({
  username: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterReq = z.infer<typeof registerReqSchema>;

export const loginReqSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginReq = z.infer<typeof loginReqSchema>;

export interface LoginResponse extends BaseResponse {
  data: {
    authtoken: string;
  };
}

export interface JWTPayload {
  id: number;
}
