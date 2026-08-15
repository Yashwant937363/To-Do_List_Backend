import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pool } from "../config/database.js";
import { createUser, getUser, getUserById } from "./user-service.js";
import { UserNotExist } from "../errors/UserNotExistError.js";
import { DublicateEmailError } from "../errors/DublicateEmailError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("User Service", () => {
  let querySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    querySpy = vi.spyOn(pool, "query");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createUser()", () => {
    it("should create a new user and return auth token", async () => {
      // Arrange
      const registerData = {
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
      };

      vi.spyOn(bcrypt, "genSalt").mockResolvedValue("mocked_salt" as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("mocked_hash" as never);
      vi.spyOn(jwt, "sign").mockReturnValue("mocked_token" as any);

      querySpy.mockResolvedValue({
        rows: [{ id: 1 }],
      } as any);

      // Act
      const response = await createUser(registerData);

      // Assert
      expect(response).toEqual({
        status: 201,
        message: "user created",
        data: {
          authtoken: "mocked_token",
        },
        user_id: 1,
      });

      expect(querySpy).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        ["johndoe", "john@example.com", "mocked_hash"]
      );
    });

    it("should throw DublicateEmailError when email already exists", async () => {
      // Arrange
      vi.spyOn(bcrypt, "genSalt").mockResolvedValue("mocked_salt" as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("mocked_hash" as never);

      const dbError = new Error("Duplicate key error") as any;
      dbError.code = "23505";
      querySpy.mockRejectedValue(dbError);

      // Act + Assert
      await expect(
        createUser({
          username: "johndoe",
          email: "john@example.com",
          password: "password123",
        })
      ).rejects.toBeInstanceOf(DublicateEmailError);
    });

    it("should propagate database errors", async () => {
      // Arrange
      vi.spyOn(bcrypt, "genSalt").mockResolvedValue("mocked_salt" as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("mocked_hash" as never);

      const databaseError = new Error("Database connection failed");
      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(
        createUser({
          username: "johndoe",
          email: "john@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getUser()", () => {
    it("should return user details by email", async () => {
      // Arrange
      const user = {
        id: 1,
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
      };

      querySpy.mockResolvedValue({
        rows: [user],
      } as any);

      // Act
      const result = await getUser({ email: "john@example.com" });

      // Assert
      expect(result).toEqual(user);
      expect(querySpy).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM users WHERE email=$1"),
        ["john@example.com"]
      );
    });

    it("should throw UserNotExist when user is not found", async () => {
      // Arrange
      querySpy.mockResolvedValue({
        rows: [],
      } as any);

      // Act + Assert
      await expect(
        getUser({ email: "nonexistent@example.com" })
      ).rejects.toBeInstanceOf(UserNotExist);
    });

    it("should propagate database errors", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");
      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(
        getUser({ email: "john@example.com" })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getUserById()", () => {
    it("should return user details by id", async () => {
      // Arrange
      const user = {
        id: 1,
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
      };

      querySpy.mockResolvedValue({
        rows: [user],
      } as any);

      // Act
      const result = await getUserById({ id: 1 });

      // Assert
      expect(result).toEqual(user);
      expect(querySpy).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM users WHERE id=$1"),
        [1]
      );
    });

    it("should throw UserNotExist when user is not found", async () => {
      // Arrange
      querySpy.mockResolvedValue({
        rows: [],
      } as any);

      // Act + Assert
      await expect(getUserById({ id: 999 })).rejects.toBeInstanceOf(
        UserNotExist
      );
    });

    it("should propagate database errors", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");
      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(getUserById({ id: 1 })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
