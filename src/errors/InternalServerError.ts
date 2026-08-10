export class InternalServerError extends Error {
  statusCode: number;
  constructor() {
    super("Internal Server Error");
    this.statusCode = 500;
  }
}
