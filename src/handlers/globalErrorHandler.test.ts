import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { globalErrorHandler } from "./globalErrorHandler.js";
import { DublicateEmailError } from "../errors/DublicateEmailError.js";
import { UserNotExist } from "../errors/UserNotExistError.js";
import { NoteNotFound } from "../errors/NoteNotFound.js";

describe("Global Error Handler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle DublicateEmailError and return 409 with masked email log", () => {
    // Arrange
    const error = new DublicateEmailError();
    const req = {
      body: {
        email: "john.doe@example.com",
      },
      log: {
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    globalErrorHandler(error, req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      {
        email: "j***e@example.com",
      },
      "Duplicate email error",
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Email Already Exists",
    });
  });

  it("should handle UserNotExist error and return 404 with details log", () => {
    // Arrange
    const error = new UserNotExist({ email: "notfound@example.com" });
    const req = {
      log: {
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    globalErrorHandler(error, req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      {
        details: { email: "notfound@example.com" },
      },
      "User not found error",
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User Not Found",
    });
  });

  it("should handle NoteNotFound error and return 404 with details log", () => {
    // Arrange
    const error = new NoteNotFound({ note_id: 5, user_id: 10 });
    const req = {
      log: {
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    globalErrorHandler(error, req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      {
        details: { note_id: 5, user_id: 10 },
      },
      "Note not found error",
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Note Not Found",
    });
  });

  it("should handle unhandled errors and return 500", () => {
    // Arrange
    const error = new Error("Unexpected database crash");
    const req = {
      log: {
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    globalErrorHandler(error, req, res, next);

    // Assert
    expect(req.log.error).toHaveBeenCalledWith(error, "Unhandled error");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });
  });
});
