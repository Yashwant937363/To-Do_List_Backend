import { describe, it, expect, vi, afterEach } from "vitest";
import { validateParms } from "./validateParms.js";
import { z } from "zod";

describe("validateParms Middleware", () => {
  const schema = z.object({
    id: z.string().min(1, "Id is required"),
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should validate params successfully and call next()", () => {
    // Arrange
    const middleware = validateParms(schema as any);
    const req = {
      params: {
        id: "123",
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
    middleware(req, res, next);

    // Assert
    expect(req.params).toEqual({
      id: "123",
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 when params validation fails", () => {
    // Arrange
    const middleware = validateParms(schema as any);
    const req = {
      params: {
        id: "",
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
    middleware(req, res, next);

    // Assert
    expect(req.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
      "Invalid request parameters",
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid Request parameters",
      errors: expect.arrayContaining(["Id is required"]),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 when schema parsing throws an unexpected exception", () => {
    // Arrange
    const faultySchema = {
      safeParse: () => {
        throw new Error("Unexpected crash");
      },
    } as any;

    const middleware = validateParms(faultySchema);
    const req = {
      params: {},
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
    middleware(req, res, next);

    // Assert
    expect(req.log.error).toHaveBeenCalledWith(
      expect.any(Error),
      "Error validating request parameters",
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
