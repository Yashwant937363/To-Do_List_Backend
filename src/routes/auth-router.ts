import { Router } from "express";
import {
  loginUser,
  loginUserByToken,
  registerUser,
} from "../controllers/auth-controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginReqSchema, registerReqSchema } from "../schemas/auth-schema.js";
import { authUser } from "../middleware/authUser.js";

const router: Router = Router();

router.post("/register", validateBody(registerReqSchema), registerUser);
router.post("/login", validateBody(loginReqSchema), loginUser);
router.get("/", authUser, loginUserByToken);

export default router;
