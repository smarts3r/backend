import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

const notFoundPageRoutes = Router();

export default notFoundPageRoutes.use(
  (_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({ message: "Page not found" });
  },
);
