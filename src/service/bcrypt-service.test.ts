import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import bcrypt from "bcrypt";
import { getHash, compareHash } from "./bcrypt-service.js";

describe("Bcrypt Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getHash()", () => {
    it("should generate hash for the given data", async () => {
      // Arrange
      const saltSpy = vi
        .spyOn(bcrypt, "genSalt")
        .mockResolvedValue("mocked_salt" as never);
      const hashSpy = vi
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("mocked_hash" as never);

      // Act
      const result = await getHash("password123");

      // Assert
      expect(result).toBe("mocked_hash");
      expect(saltSpy).toHaveBeenCalledWith(10);
      expect(hashSpy).toHaveBeenCalledWith("password123", "mocked_salt");
    });

    it("should propagate errors from bcrypt", async () => {
      // Arrange
      vi.spyOn(bcrypt, "genSalt").mockRejectedValue(
        new Error("Salt failed") as never
      );

      // Act + Assert
      await expect(getHash("password123")).rejects.toThrow("Salt failed");
    });
  });

  describe("compareHash()", () => {
    it("should return true when data matches hash", async () => {
      // Arrange
      const compareSpy = vi
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true as never);

      // Act
      const result = await compareHash("mocked_hash", "password123");

      // Assert
      expect(result).toBe(true);
      expect(compareSpy).toHaveBeenCalledWith("password123", "mocked_hash");
    });

    it("should return false when data does not match hash", async () => {
      // Arrange
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      // Act
      const result = await compareHash("mocked_hash", "wrong_password");

      // Assert
      expect(result).toBe(false);
    });

    it("should propagate errors from bcrypt", async () => {
      // Arrange
      vi.spyOn(bcrypt, "compare").mockRejectedValue(
        new Error("Compare failed") as never
      );

      // Act + Assert
      await expect(
        compareHash("mocked_hash", "password123")
      ).rejects.toThrow("Compare failed");
    });
  });
});
