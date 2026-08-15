import { describe, it, expect, vi, afterEach } from "vitest";
import { validateBody } from "./validateBody.js";
import { z } from "zod";

describe("validateBody Middleware", () => {
  const schema = z.object({
    title: z.string().min(1, "Title is required"),
    age: z.number(),
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should validate body successfully and call next()", () => {
    // Arrange
    const middleware = validateBody(schema as any);
    const req = {
      body: {
        title: "Test title",
        age: 25,
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
    expect(req.body).toEqual({
      title: "Test title",
      age: 25,
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 when body validation fails", () => {
    // Arrange
    const middleware = validateBody(schema as any);
    const req = {
      body: {
        title: "",
        age: "not_a_number",
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
      "Invalid request body",
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid Request body",
      errors: expect.arrayContaining(["Title is required"]),
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

    const middleware = validateBody(faultySchema);
    const req = {
      body: {},
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
      "Error validating request body",
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
