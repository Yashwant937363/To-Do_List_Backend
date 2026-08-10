export class DublicateEmailError extends Error {
  statusCode: number;

  constructor() {
    super("Email Already Exists");
    this.statusCode = 409;
  }
}
