export class NoteNotFound extends Error {
  statusCode: number;
  constructor() {
    super("Note Not Found");
    this.statusCode = 404;
  }
}
