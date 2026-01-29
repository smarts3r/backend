import type { NextFunction, Request, Response } from "express";
import { User } from "../types";
import prisma from "@/lib/prisma";
import { getSession, setSession } from "../services/sessionCache";
import { ACCESS_TOKEN_SECRET, verifyToken } from "../utils/authUtilities";

interface TokenPayload {
  id: string;
  role: string;
}

const handleUnauthorized = (_req: Request, res: Response, message: string) => {
  return res
    .status(message === "Access Token Required" ? 401 : 403)
    .json({ message });
};

export const authenticateToken = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies.accessToken;

  if (!token) {
    return handleUnauthorized(req, res, "Access Token Required");
  }

  try {
    const userData = verifyToken(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    let user = getSession(userData.id);

    if (!user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: Number(userData.id) },
      });
      if (!dbUser) {
        return handleUnauthorized(req, res, "User Not Found");
      }

      user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.username || undefined,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at,
      };
      setSession(userData.id, user);
    }

    req.user = user;
    next();
  } catch (err: any) {
    return handleUnauthorized(
      req,
      res,
      err.name === "TokenExpiredError" ? "Token Expired" : "Invalid Token",
    );
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request & { user?: User }, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return handleUnauthorized(
        req,
        res,
        "Access Denied: Insufficient Permissions",
      );
    }
    next();
  };
};
