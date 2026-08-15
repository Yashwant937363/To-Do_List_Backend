import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { metricsMiddleware } from "./matricsMiddleware.js";
import {
  httpActiveRequests,
  httpErrorsTotal,
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from "../config/metrics.js";

const endTimerMock = vi.fn();

vi.mock("../config/metrics.js", () => ({
  httpRequestDurationSeconds: {
    startTimer: vi.fn(() => endTimerMock),
  },
  httpActiveRequests: {
    inc: vi.fn(),
    dec: vi.fn(),
  },
  httpRequestsTotal: {
    inc: vi.fn(),
  },
  httpErrorsTotal: {
    inc: vi.fn(),
  },
}));

describe("metricsMiddleware Middleware", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start timer, increment active requests, and call next()", () => {
    // Arrange
    const req = {
      method: "GET",
      path: "/notes",
      route: { path: "/notes" },
    } as any;

    const res = {
      statusCode: 200,
      on: vi.fn(),
    } as any;

    const next = vi.fn();

    // Act
    metricsMiddleware(req, res, next);

    // Assert
    expect(httpRequestDurationSeconds.startTimer).toHaveBeenCalled();
    expect(httpActiveRequests.inc).toHaveBeenCalledWith({
      method: "GET",
      route: "/notes",
    });
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
    expect(next).toHaveBeenCalled();
  });

  it("should record metrics on successful response finish (< 400)", () => {
    // Arrange
    let finishCallback: () => void = () => {};

    const req = {
      method: "GET",
      path: "/notes",
      route: { path: "/notes" },
    } as any;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "finish") finishCallback = cb;
      }),
    } as any;

    const next = vi.fn();

    metricsMiddleware(req, res, next);

    // Act - Trigger finish event
    finishCallback();

    // Assert
    expect(endTimerMock).toHaveBeenCalledWith({
      method: "GET",
      route: "/notes",
      status: "200",
    });
    expect(httpActiveRequests.dec).toHaveBeenCalledWith({
      method: "GET",
      route: "/notes",
    });
    expect(httpRequestsTotal.inc).toHaveBeenCalledWith({
      method: "GET",
      route: "/notes",
      status: "200",
    });
    expect(httpErrorsTotal.inc).not.toHaveBeenCalled();
  });

  it("should increment httpErrorsTotal on error response finish (>= 400)", () => {
    // Arrange
    let finishCallback: () => void = () => {};

    const req = {
      method: "POST",
      path: "/notes",
    } as any;

    const res = {
      statusCode: 404,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "finish") finishCallback = cb;
      }),
    } as any;

    const next = vi.fn();

    metricsMiddleware(req, res, next);

    // Act - Trigger finish event
    finishCallback();

    // Assert
    expect(endTimerMock).toHaveBeenCalledWith({
      method: "POST",
      route: "/notes",
      status: "404",
    });
    expect(httpActiveRequests.dec).toHaveBeenCalledWith({
      method: "POST",
      route: "/notes",
    });
    expect(httpRequestsTotal.inc).toHaveBeenCalledWith({
      method: "POST",
      route: "/notes",
      status: "404",
    });
    expect(httpErrorsTotal.inc).toHaveBeenCalledWith({
      method: "POST",
      route: "/notes",
      status: "404",
    });
  });
});
