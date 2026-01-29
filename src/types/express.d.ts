import "express";
import type { File } from "multer";
import type { User } from "./index";

declare global {
  namespace Express {
    interface Request {
      file?: File;
      user?: User;
    }
  }
}
