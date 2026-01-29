import { Router } from "express";
import { getCategories } from "@/controllers/category.controller.ts";

const router = Router();

router.get("/", getCategories);

export default router;
