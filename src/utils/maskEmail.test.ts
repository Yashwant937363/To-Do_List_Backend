import { describe, it, expect } from "vitest";
import { maskEmail } from "./maskEmail.js";

describe("maskEmail Util", () => {
  it("should mask email with local part length > 2", () => {
    // Arrange
    const email = "johndoe@example.com";

    // Act
    const result = maskEmail(email);

    // Assert
    expect(result).toBe("j***e@example.com");
  });

  it("should mask email with local part length <= 2", () => {
    // Arrange & Act & Assert
    expect(maskEmail("ab@example.com")).toBe("a***@example.com");
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  it("should return [INVALID_EMAIL] for empty or missing @ symbol", () => {
    // Arrange & Act & Assert
    expect(maskEmail("")).toBe("[INVALID_EMAIL]");
    expect(maskEmail("invalidemail")).toBe("[INVALID_EMAIL]");
  });
});
