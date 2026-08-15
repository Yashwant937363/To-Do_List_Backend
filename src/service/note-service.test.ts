import {
  createNewNote,
  deleteNoteById,
  updateNoteById,
} from "./note-service.js";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pool } from "../config/database.js";
import { NoteNotFound } from "../errors/NoteNotFound.js";
import { getAllNotes } from "./note-service.js";
describe("Note Service", () => {
  let querySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    querySpy = vi.spyOn(pool, "query");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("getAllNotes()", () => {
    it("should return all notes for a user", async () => {
      // Arrange
      const notes = [
        {
          id: 1,
          title: "First note",
          body: "First body",
          tag: "work",
          user_id: 10,
        },
        {
          id: 2,
          title: "Second note",
          body: "Second body",
          tag: "personal",
          user_id: 10,
        },
      ];

      querySpy.mockResolvedValue({
        rows: notes,
      } as any);

      // Act
      const response = await getAllNotes({
        user_id: 10,
      });

      // Assert
      expect(response).toEqual({
        message: "fetched all notes",
        status: 200,
        data: notes,
      });

      expect(querySpy).toHaveBeenCalledWith(
        "SELECT * FROM notes WHERE user_id=$1",
        [10],
      );
    });
    it("should throw NoteNotFound when user has no notes", async () => {
      // Arrange
      querySpy.mockResolvedValue({
        rows: [],
      } as any);

      // Act + Assert
      await expect(
        getAllNotes({
          user_id: 10,
        }),
      ).rejects.toBeInstanceOf(NoteNotFound);
    });
    it("should propagate database errors", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");

      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(
        getAllNotes({
          user_id: 10,
        }),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("createNewNote()", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it("should create a new note", async () => {
      // Arrange
      const note = {
        id: 1,
        title: "My first note",
        body: "This is my note",
        user_id: 10,
        tag: "work",
      };

      querySpy.mockResolvedValue({
        rows: [note],
      } as any);

      // Act
      const response = await createNewNote({
        title: note.title,
        body: note.body,
        user_id: note.user_id,
        tag: note.tag,
      });

      // Assert
      expect(response).toEqual({
        message: "note created",
        status: 201,
        data: {
          note,
        },
      });

      expect(querySpy).toHaveBeenCalledWith(
        "INSERT INTO notes(title, body, user_id, tag) VALUES($1,$2,$3,$4) RETURNING *",
        ["My first note", "This is my note", 10, "work"],
      );
    });
    it("should propagate database errors", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");

      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(
        createNewNote({
          title: "My note",
          body: "My body",
          tag: "work",
          user_id: 10,
        }),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("updateNoteById()", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should update a note", async () => {
      // Arrange
      const note = {
        id: 5,
        title: "Updated title",
        body: "Updated body",
        tag: "work",
        user_id: 10,
      };

      querySpy.mockResolvedValue({
        rows: [note],
      } as any);

      // Act
      const response = await updateNoteById({
        id: 5,
        title: "Updated title",
        body: "Updated body",
        tag: "work",
        user_id: 10,
      });

      // Assert
      expect(response).toEqual({
        message: "note updated",
        status: 200,
        data: {
          note,
        },
      });

      expect(querySpy).toHaveBeenCalledWith(
        "UPDATE notes SET title=$1,body=$2,tag=$3 WHERE user_id=$4 AND id=$5 RETURNING *",
        ["Updated title", "Updated body", "work", 10, 5],
      );
    });
    it("should throw NoteNotFound when the note does not exist", async () => {
      // Arrange
      querySpy.mockResolvedValue({
        rows: [],
      } as any);

      // Act + Assert
      await expect(
        updateNoteById({
          id: 5,
          title: "Updated title",
          body: "Updated body",
          tag: "work",
          user_id: 10,
        }),
      ).rejects.toBeInstanceOf(NoteNotFound);
    });
    it("should propagate database errors", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");

      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(
        updateNoteById({
          id: 5,
          title: "Updated title",
          body: "Updated body",
          tag: "work",
          user_id: 10,
        }),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("deleteNoteById()", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should delete a note", async () => {
      // Arrange
      const note = {
        id: 5,
        title: "Note to delete",
        body: "This note will be deleted",
        tag: "work",
        user_id: 10,
      };

      querySpy.mockResolvedValue({
        rows: [note],
      } as any);

      // Act
      const response = await deleteNoteById({
        id: 5,
        user_id: 10,
      });

      // Assert
      expect(response).toEqual({
        message: "note deleted",
        status: 200,
        data: {
          note,
        },
      });

      expect(querySpy).toHaveBeenCalledWith(
        "DELETE FROM notes WHERE user_id=$1 AND id=$2 RETURNING *",
        [10, 5],
      );
    });
    it("should throw NoteNotFound when the note does not exist", async () => {
      // Arrange
      querySpy.mockResolvedValue({
        rows: [],
      } as any);

      // Act + Assert
      await expect(
        deleteNoteById({
          id: 5,
          user_id: 10,
        }),
      ).rejects.toBeInstanceOf(NoteNotFound);
    });
    it("should propagate database errors", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");

      querySpy.mockRejectedValue(databaseError);

      // Act + Assert
      await expect(
        deleteNoteById({
          id: 5,
          user_id: 10,
        }),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
