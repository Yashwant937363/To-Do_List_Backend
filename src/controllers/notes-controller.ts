import {
  response,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { NoteNotFound } from "../errors/NoteNotFound.js";
import type {
  CreateNoteReq,
  DeleteNoteReq,
  NoteParms,
  UpdateNoteReq,
} from "../schemas/notes-schema.js";
import type { JWTPayload } from "../schemas/auth-schema.js";
import {
  createNewNote,
  deleteNoteById,
  getAllNotes,
  updateNoteById,
} from "../service/note-service.js";

export const getNotes = async (
  req: Request,
  res: Response<any, JWTPayload>,
  next: NextFunction,
) => {
  try {
    const response = await getAllNotes({
      user_id: res.locals.id,
    });
    req.log.info(
      {
        user_id: res.locals.id,
      },
      "Fetched all notes successfully",
    );
    return res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    next(e);
  }
};
export const createNote = async (
  req: Request<{}, {}, CreateNoteReq>,
  res: Response<any, JWTPayload>,
  next: NextFunction,
) => {
  try {
    const response = await createNewNote({
      ...req.body,
      user_id: res.locals.id,
    });
    req.log.info(
      {
        user_id: res.locals.id,
        note_id: response.data.note.id,
      },
      "Note created successfully",
    );
    return res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    next(e);
  }
};
export const updateNote = async (
  req: Request<NoteParms, {}, UpdateNoteReq>,
  res: Response<any, JWTPayload>,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const response = await updateNoteById({
      ...req.body,
      user_id: res.locals.id,
      id,
    });
    req.log.info(
      { user_id: res.locals.id, note_id: id },
      "Note updated successfully",
    );
    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e: any) {
    next(e);
  }
};
export const deleteNote = async (
  req: Request<NoteParms, {}, {}>,
  res: Response<any, JWTPayload>,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const response = await deleteNoteById({
      id,
      user_id: res.locals.id,
    });
    req.log.info(
      { user_id: res.locals.id, note_id: id },
      "Note deleted successfully",
    );
    return res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    next(e);
  }
};
