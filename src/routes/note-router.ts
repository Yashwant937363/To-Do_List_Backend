import { Router } from "express";
import { authUser } from "../middleware/authUser.js";
import { validateBody } from "../middleware/validateBody.js";
import { noteBodySchema, noteParamsSchema } from "../schemas/notes-schema.js";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../controllers/notes-controller.js";
import { validateParms } from "../middleware/validateParms.js";

const router = Router();

router.use(authUser);

router.get("/all", authUser, getNotes);
router.post("/", validateBody(noteBodySchema), createNote);
router.patch(
  "/:id",
  validateParms(noteParamsSchema),
  validateBody(noteBodySchema),
  updateNote,
);
router.delete("/:id", validateParms(noteParamsSchema), deleteNote);

export default router;
