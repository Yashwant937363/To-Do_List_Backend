import * as z from "zod";
import type { BaseResponse } from "./base-schema.js";
import type { Note } from "./note-schema.js";

export const noteBodySchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().min(1),
  tag: z.string().min(1).max(100),
});

export type CreateNoteReq = z.infer<typeof noteBodySchema>;

export type UpdateNoteReq = z.infer<typeof noteBodySchema>;

export interface NoteOperationsRes extends BaseResponse {
  data: {
    note: Note;
  };
}

export const noteParamsSchema = z.object({
  id: z.string(),
});

export type NoteParms = z.infer<typeof noteParamsSchema>;

export const deleteNoteSchema = z.object({
  user_id: z.number(),
});

export type DeleteNoteReq = z.infer<typeof deleteNoteSchema>;

export interface GetAllNotesResponse extends BaseResponse {
  data: Note[];
}
