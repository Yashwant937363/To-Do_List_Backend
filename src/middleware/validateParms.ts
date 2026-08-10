import type { NextFunction, Request, Response } from "express";
import * as z from "zod";

export const validateParms = (schema: z.ZodObject) => {
  type SchemaType = z.infer<typeof schema>;
  return (req: Request<SchemaType>, res: Response, next: NextFunction) => {
    try {
      const body = schema.safeParse(req.params);

      if (!body.success) {
        return res.status(400).json({
          message: "Invalid Request body",
          errors: body.error.issues.map((error) => error.message),
        });
      }
      req.params = body.data;
      next();
    } catch (e) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  };
};
