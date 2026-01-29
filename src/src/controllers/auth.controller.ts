import type { Request, Response } from "express";
import { prisma } from "@/lib/prisma.ts";

// Define Role manually since SQLite doesn't support Enums in Prisma
const Role = {
  user: "user",
  admin: "ADMIN",
};

import { deleteSession, setSession } from "@/services/sessionCache.ts";
import {
  comparePassword,
  cookieOptsLong,
  cookieOptsShort,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  isEmail,
  normalize,
  REFRESH_TOKEN_SECRET,
  verifyToken,
} from "@/utils/authUtilities.ts";

// controllers

export const register = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body ?? {};

  if (!password || !email) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const cleanEmail = normalize(email);
  const cleanUsername = username ? username.trim() : null;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          cleanEmail ? { email: cleanEmail } : undefined,
          cleanUsername ? { username: cleanUsername } : undefined,
        ].filter(Boolean) as any,
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        role:
          role && typeof role === "string" && Object.values(Role).includes(role)
            ? role
            : Role.user,
      },
      select: { id: true },
    });

    return res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body ?? {};

  if (!loginIdentifier || !password) {
    return res
      .status(400)
      .json({ message: "Username/Email and password are required" });
  }

  const identifier = loginIdentifier.trim();
  const byEmail = isEmail(identifier);

  try {
    const user = await prisma.user.findFirst({
      where: byEmail
        ? { email: normalize(identifier) }
        : { username: identifier },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        password: true,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(publicUser);
    const refreshToken = generateRefreshToken(publicUser);

    res.cookie("accessToken", accessToken, cookieOptsShort);
    res.cookie("refreshToken", refreshToken, cookieOptsLong);

    setSession(user.id, publicUser);

    return res.json({
      user: publicUser,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const userData = verifyToken(refreshToken, REFRESH_TOKEN_SECRET);

    const newAccessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData);

    res.cookie("accessToken", newAccessToken, cookieOptsShort);
    res.cookie("refreshToken", newRefreshToken, cookieOptsLong);

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = (req: Request, res: Response) => {
  const { id } = (req as any).user ?? {};
  if (id) deleteSession(id);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out successfully" });
};

export const forgetPassword = async (_req: Request, _res: Response) => {
  return _res.json({ message: "Password reset functionality not implemented" });
};
