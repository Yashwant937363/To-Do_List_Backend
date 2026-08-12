export class UserNotExist extends Error {
  statusCode: number;
  data: any;

  constructor(data: any) {
    super("User Not Found");
    this.statusCode = 404;
    this.data = data;
  }
}
