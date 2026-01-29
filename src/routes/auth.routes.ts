import express from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "@/controllers/auth.controller.ts";
import { validateRegister, validateLogin } from "@/middlewares/validationMiddleware";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
