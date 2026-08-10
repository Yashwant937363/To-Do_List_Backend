import { response, type Request, type Response } from "express";
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
) => {
  try {
    const response = await getAllNotes({
      user_id: res.locals.id,
    });
    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    if (e instanceof NoteNotFound) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.log("Something went wrong", e);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const createNote = async (
  req: Request<{}, {}, CreateNoteReq>,
  res: Response<any, JWTPayload>,
) => {
  console.log(`"Got Req"`);
  try {
    const response = await createNewNote({
      ...req.body,
      user_id: res.locals.id,
    });
    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    console.log("Something went wrong", e);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateNote = async (
  req: Request<NoteParms, {}, UpdateNoteReq>,
  res: Response<any, JWTPayload>,
) => {
  try {
    const id = Number(req.params.id);
    const response = await updateNoteById({
      ...req.body,
      user_id: res.locals.id,
      id,
    });
    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e: any) {
    if (e instanceof NoteNotFound) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.log("Something went wrong", e);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const deleteNote = async (
  req: Request<NoteParms, {}, {}>,
  res: Response<any, JWTPayload>,
) => {
  try {
    const id = Number(req.params.id);
    const response = await deleteNoteById({
      id,
      user_id: res.locals.id,
    });
    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (e) {
    if (e instanceof NoteNotFound) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    console.log("Something went wrong", e);
    res.status(500).json({ message: "Something went wrong" });
  }
};
