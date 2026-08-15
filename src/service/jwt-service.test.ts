import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { generateToken, verifyToken } from "./jwt-service.js";
import { env } from "../config/env.js";

describe("JWT Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateToken()", () => {
    it("should generate a token for given payload", () => {
      // Arrange
      const payload = { id: 10, email: "test@example.com" };
      const signSpy = vi
        .spyOn(jwt, "sign")
        .mockReturnValue("mocked_jwt_token" as any);

      // Act
      const token = generateToken(payload);

      // Assert
      expect(token).toBe("mocked_jwt_token");
      expect(signSpy).toHaveBeenCalledWith(payload, env.jwt_secret);
    });

    it("should propagate errors when jwt.sign fails", () => {
      // Arrange
      vi.spyOn(jwt, "sign").mockImplementation(() => {
        throw new Error("JWT sign error");
      });

      // Act + Assert
      expect(() => generateToken({ id: 10 })).toThrow("JWT sign error");
    });
  });

  describe("verifyToken()", () => {
    it("should verify and return payload for a valid token", () => {
      // Arrange
      const payload = { id: 10, email: "test@example.com" };
      const verifySpy = vi
        .spyOn(jwt, "verify")
        .mockReturnValue(payload as any);

      // Act
      const result = verifyToken<typeof payload>("valid_token");

      // Assert
      expect(result).toEqual(payload);
      expect(verifySpy).toHaveBeenCalledWith("valid_token", env.jwt_secret);
    });

    it("should propagate errors for an invalid or expired token", () => {
      // Arrange
      vi.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("jwt expired");
      });

      // Act + Assert
      expect(() => verifyToken("invalid_token")).toThrow("jwt expired");
    });
  });
});
