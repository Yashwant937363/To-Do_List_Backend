import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "./notes-controller.js";
import {
  createNewNote,
  deleteNoteById,
  getAllNotes,
  updateNoteById,
} from "../service/note-service.js";

vi.mock("../service/note-service.js", () => ({
  createNewNote: vi.fn(),
  getAllNotes: vi.fn(),
  updateNoteById: vi.fn(),
  deleteNoteById: vi.fn(),
}));

describe("Note Controller", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  describe("createNote Controller", () => {
    it("should create a note successfully", async () => {
      const serviceResponse = {
        message: "note created",
        status: 201,
        data: {
          note: {
            id: 1,
            title: "My note",
            body: "My body",
            tag: "work",
            user_id: 10,
          },
        },
      };

      vi.mocked(createNewNote).mockResolvedValue(serviceResponse);

      const req = {
        body: {
          title: "My note",
          body: "My body",
          tag: "work",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await createNote(req, res, next);

      expect(createNewNote).toHaveBeenCalledWith({
        title: "My note",
        body: "My body",
        tag: "work",
        user_id: 10,
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 10,
          note_id: 1,
        },
        "Note created successfully",
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        message: "note created",
        data: serviceResponse.data,
      });

      expect(next).not.toHaveBeenCalled();
    });
    it("should pass the error to next()", async () => {
      const error = new Error("Database connection failed");

      vi.mocked(createNewNote).mockRejectedValue(error);

      const req = {
        body: {
          title: "My note",
          body: "My body",
          tag: "work",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await createNote(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  describe("getNotes Controller", () => {
    it("should fetch all notes successfully", async () => {
      const serviceResponse = {
        message: "fetched all notes",
        status: 200,
        data: [
          {
            id: 1,
            title: "My note",
            body: "My body",
            tag: "work",
            user_id: 10,
          },
        ],
      };

      vi.mocked(getAllNotes).mockResolvedValue(serviceResponse);

      const req = {
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await getNotes(req, res, next);

      expect(getAllNotes).toHaveBeenCalledWith({
        user_id: 10,
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 10,
        },
        "Fetched all notes successfully",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "fetched all notes",
        data: serviceResponse.data,
      });

      expect(next).not.toHaveBeenCalled();
    });
    it("should pass the error to next()", async () => {
      const error = new Error("Database connection failed");

      vi.mocked(getAllNotes).mockRejectedValue(error);

      const req = {
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await getNotes(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("updateNote Controller", () => {
    it("should update a note successfully", async () => {
      const serviceResponse = {
        message: "note updated",
        status: 200,
        data: {
          note: {
            id: 5,
            title: "Updated title",
            body: "Updated body",
            tag: "personal",
            user_id: 10,
          },
        },
      };

      vi.mocked(updateNoteById).mockResolvedValue(serviceResponse);

      const req = {
        params: {
          id: "5",
        },
        body: {
          title: "Updated title",
          body: "Updated body",
          tag: "personal",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await updateNote(req, res, next);

      expect(updateNoteById).toHaveBeenCalledWith({
        title: "Updated title",
        body: "Updated body",
        tag: "personal",
        user_id: 10,
        id: 5,
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 10,
          note_id: 5,
        },
        "Note updated successfully",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "note updated",
        data: serviceResponse.data,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass the error to next()", async () => {
      const error = new Error("Note not found");

      vi.mocked(updateNoteById).mockRejectedValue(error);

      const req = {
        params: {
          id: "5",
        },
        body: {
          title: "Updated title",
          body: "Updated body",
          tag: "personal",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await updateNote(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("deleteNote Controller", () => {
    it("should delete a note successfully", async () => {
      const serviceResponse = {
        message: "note deleted",
        status: 200,
        data: {
          note: {
            id: 5,
            title: "Note to delete",
            body: "Note body",
            tag: "work",
            user_id: 10,
          },
        },
      };

      vi.mocked(deleteNoteById).mockResolvedValue(serviceResponse);

      const req = {
        params: {
          id: "5",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await deleteNote(req, res, next);

      expect(deleteNoteById).toHaveBeenCalledWith({
        id: 5,
        user_id: 10,
      });

      expect(req.log.info).toHaveBeenCalledWith(
        {
          user_id: 10,
          note_id: 5,
        },
        "Note deleted successfully",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "note deleted",
        data: serviceResponse.data,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass the error to next()", async () => {
      const error = new Error("Database connection failed");

      vi.mocked(deleteNoteById).mockRejectedValue(error);

      const req = {
        params: {
          id: "5",
        },
        log: {
          info: vi.fn(),
        },
      } as any;

      const res = {
        locals: {
          id: 10,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const next = vi.fn();

      await deleteNote(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
