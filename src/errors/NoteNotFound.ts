export class NoteNotFound extends Error {
  statusCode: number;
  data: any;
  constructor(data: any) {
    super("Note Not Found");
    this.statusCode = 404;
    this.data = data;
  }
}
