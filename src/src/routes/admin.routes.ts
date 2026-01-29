import express from "express";
import { getAdminStats } from "../controllers/admin-stats.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/stats", authenticateToken, authorizeRoles("ADMIN"), getAdminStats);

export default router;

// End of file
