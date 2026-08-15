import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  loginUser,
  loginUserByToken,
  registerUser,
} from "./auth-controller.js";
import { createUser, getUser, getUserById } from "../service/user-service.js";
import { compareHash } from "../service/bcrypt-service.js";
import { generateToken } from "../service/jwt-service.js";

vi.mock("../service/user-service.js", () => ({
  createUser: vi.fn(),
  getUser: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("../service/bcrypt-service.js", () => ({
  compareHash: vi.fn(),
  getHash: vi.fn(),
}));

vi.mock("../service/jwt-service.js", () => ({
  generateToken: vi.fn(),
}));

describe("Auth Controller", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("registerUser Controller", () => {
    it("should register a user successfully", async () => {
      const serviceResponse = {
        status: 201,
        message: "user created",
        data: {
          authtoken: "mocked_jwt_token",
        },
        user_id: 1,
      };

      vi.mocked(createUser).mockResolvedValue(serviceResponse);

      const req = {
        body: {
          username: "johndoe",
          email: "john@example.com",
          password: "password123",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await registerUser(req, res, next);

      expect(createUser).toHaveBeenCalledWith({
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 1,
        },
        "User registered successfully",
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        message: "user created",
        data: serviceResponse.data,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass the error to next()", async () => {
      const error = new Error("Duplicate email");

      vi.mocked(createUser).mockRejectedValue(error);

      const req = {
        body: {
          username: "johndoe",
          email: "john@example.com",
          password: "password123",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("loginUser Controller", () => {
    it("should log in user successfully with valid credentials", async () => {
      const user = {
        id: 1,
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
      };

      vi.mocked(getUser).mockResolvedValue(user as any);
      vi.mocked(compareHash).mockResolvedValue(true as any);
      vi.mocked(generateToken).mockReturnValue("mocked_jwt_token" as any);

      const req = {
        body: {
          email: "john@example.com",
          password: "password123",
        },
        log: {
          info: vi.fn(),
          warn: vi.fn(),
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await loginUser(req, res, next);

      expect(getUser).toHaveBeenCalledWith({
        email: "john@example.com",
      });

      expect(compareHash).toHaveBeenCalledWith(
        "hashed_password",
        "password123",
      );

      expect(generateToken).toHaveBeenCalledWith({
        id: 1,
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 1,
        },
        "User logged in successfully",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "User logged in",
        data: {
          authtoken: "mocked_jwt_token",
          username: "johndoe",
        },
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 Unauthorized when password does not match", async () => {
      const user = {
        id: 1,
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
      };

      vi.mocked(getUser).mockResolvedValue(user as any);
      vi.mocked(compareHash).mockResolvedValue(false as any);

      const req = {
        body: {
          email: "john@example.com",
          password: "wrong_password",
        },
        log: {
          info: vi.fn(),
          warn: vi.fn(),
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await loginUser(req, res, next);

      expect(getUser).toHaveBeenCalledWith({
        email: "john@example.com",
      });

      expect(compareHash).toHaveBeenCalledWith(
        "hashed_password",
        "wrong_password",
      );

      expect(req.log.warn).toHaveBeenCalledWith(
        {
          user_id: 1,
        },
        "Unauthorized access attempt: Invalid credentials",
      );

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(generateToken).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass the error to next() when user does not exist or database fails", async () => {
      const error = new Error("User Not Found");

      vi.mocked(getUser).mockRejectedValue(error);

      const req = {
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
        log: {
          info: vi.fn(),
          warn: vi.fn(),
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await loginUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("loginUserByToken Controller", () => {
    it("should log in user by token successfully", async () => {
      const user = {
        id: 10,
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
      };

      vi.mocked(getUserById).mockResolvedValue(user as any);
      vi.mocked(generateToken).mockReturnValue("mocked_new_jwt_token" as any);

      const req = {
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await loginUserByToken(req, res, next);

      expect(getUserById).toHaveBeenCalledWith({
        id: 10,
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: 10,
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 10,
        },
        "User logged in successfully by token",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "User logged in",
        data: {
          email: "john@example.com",
          username: "johndoe",
          authtoken: "mocked_new_jwt_token",
        },
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass the error to next() when getUserById fails", async () => {
      const error = new Error("User Not Found");

      vi.mocked(getUserById).mockRejectedValue(error);

      const req = {
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await loginUserByToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
