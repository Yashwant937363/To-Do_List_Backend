export class InternalServerError extends Error {
  statusCode: number;
  constructor(cause: unknown) {
    super("Internal Server Error", {
      cause,
    });
    this.statusCode = 500;
  }
}
