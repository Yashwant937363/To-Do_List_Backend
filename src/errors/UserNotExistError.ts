export class UserNotExist extends Error {
  statusCode: number;

  constructor() {
    super("User Not Found");
    this.statusCode = 404;
  }
}
