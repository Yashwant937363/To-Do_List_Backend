import { pool } from "../config/database.js";
import { InternalServerError } from "../errors/InternalServerError.js";
import { NoteNotFound } from "../errors/NoteNotFound.js";
import type { Note } from "../schemas/note-schema.js";
import type {
  GetAllNotesResponse,
  NoteOperationsRes,
} from "../schemas/notes-schema.js";

export const getAllNotes = async ({
  user_id,
}: {
  user_id: number;
}): Promise<GetAllNotesResponse> => {
  try {
    const query = "SELECT * FROM notes WHERE user_id=$1";
    const response = await pool.query(query, [user_id]);
    if (response.rows.length <= 0) {
      throw new NoteNotFound();
    }
    return {
      message: "fetched all notes",
      status: 201,
      data: response.rows,
    };
  } catch (e) {
    console.log("Something went wrong", e);
    if (e instanceof NoteNotFound) {
      throw new NoteNotFound();
    }
    throw new InternalServerError();
  }
};

interface CreateNewNote {
  title: string;
  body: string;
  tag: string;
  user_id: number;
}

export const createNewNote = async ({
  title,
  body,
  user_id,
  tag,
}: CreateNewNote): Promise<NoteOperationsRes> => {
  try {
    const query =
      "INSERT INTO notes(title, body, user_id, tag) VALUES($1,$2,$3,$4) RETURNING *";
    const response = await pool.query(query, [title, body, user_id, tag]);
    return {
      message: "note created",
      status: 201,
      data: {
        note: response.rows[0] as Note,
      },
    };
  } catch (e) {
    throw new InternalServerError();
  }
};

interface UpdateNote {
  id: number;
  title: string;
  body: string;
  tag: string;
  user_id: number;
}

export const updateNoteById = async ({
  title,
  body,
  user_id,
  tag,
  id,
}: UpdateNote): Promise<NoteOperationsRes> => {
  try {
    const query =
      "UPDATE notes SET title=$1,body=$2,tag=$3 WHERE user_id=$4 AND id=$5 RETURNING *";
    const response = await pool.query(query, [title, body, tag, user_id, id]);
    if (response.rows.length <= 0) {
      throw new NoteNotFound();
    }
    return {
      message: "note updated",
      status: 200,
      data: {
        note: response.rows[0] as Note,
      },
    };
  } catch (e) {
    console.log("Something went wrong", e);
    if (e instanceof NoteNotFound) {
      throw new NoteNotFound();
    }
    throw new InternalServerError();
  }
};

interface DeleteNote {
  id: number;
  user_id: number;
}

export const deleteNoteById = async ({
  user_id,
  id,
}: DeleteNote): Promise<NoteOperationsRes> => {
  try {
    const query = "DELETE FROM notes WHERE user_id=$1 AND id=$2 RETURNING *";
    const response = await pool.query(query, [user_id, id]);
    if (response.rows.length <= 0) {
      throw new NoteNotFound();
    }
    return {
      message: "note deleted",
      status: 200,
      data: {
        note: response.rows[0] as Note,
      },
    };
  } catch (e) {
    console.log("Something went wrong", e);
    if (e instanceof NoteNotFound) {
      throw new NoteNotFound();
    }
    throw new InternalServerError();
  }
};
