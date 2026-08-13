import type { Request, Response, NextFunction } from "express";
import {
  httpActiveRequests,
  httpErrorsTotal,
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from "../config/metrics.js";

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const end = httpRequestDurationSeconds.startTimer();
  httpActiveRequests.inc({
    method: req.method,
    route: req.route?.path ?? req.path,
  });

  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path ?? req.path,
      status: res.statusCode.toString(),
    });
    httpActiveRequests.dec({
      method: req.method,
      route: req.route?.path ?? req.path,
    });
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path ?? req.path,
      status: res.statusCode.toString(),
    });
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc({
        method: req.method,
        route: req.route?.path ?? req.path,
        status: res.statusCode.toString(),
      });
    }
  });

  next();
};
