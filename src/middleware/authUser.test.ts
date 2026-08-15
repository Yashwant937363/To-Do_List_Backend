import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authUser } from "./authUser.js";
import { verifyToken } from "../service/jwt-service.js";

vi.mock("../service/jwt-service.js", () => ({
  verifyToken: vi.fn(),
}));

describe("authUser Middleware", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should authenticate user and call next() when token is valid", async () => {
    // Arrange
    const payload = { id: 10 };
    vi.mocked(verifyToken).mockReturnValue(payload as any);

    const req = {
      headers: {
        authorization: "Bearer valid_token_123",
      },
      log: {
        warn: vi.fn(),
      },
    } as any;

    const res = {
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    await authUser(req, res, next);

    // Assert
    expect(verifyToken).toHaveBeenCalledWith("valid_token_123");
    expect(res.locals).toEqual(payload);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 when authorization header is missing", async () => {
    // Arrange
    const req = {
      headers: {},
      log: {
        warn: vi.fn(),
      },
    } as any;

    const res = {
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    await authUser(req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      "Unauthorized access attempt: Missing token",
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token format is invalid without Bearer token", async () => {
    // Arrange
    const req = {
      headers: {
        authorization: "Bearer",
      },
      log: {
        warn: vi.fn(),
      },
    } as any;

    const res = {
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    await authUser(req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      "Unauthorized access attempt: Missing token",
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token verification fails", async () => {
    // Arrange
    const error = new Error("jwt expired");
    vi.mocked(verifyToken).mockImplementation(() => {
      throw error;
    });

    const req = {
      headers: {
        authorization: "Bearer expired_token",
      },
      log: {
        warn: vi.fn(),
      },
    } as any;

    const res = {
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    // Act
    await authUser(req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      { err: error },
      "Unauthorized access attempt: Invalid token",
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });
});
