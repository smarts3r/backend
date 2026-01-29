import type { Request, Response } from "express";
import { cookieOptsLong, cookieOptsShort } from "@/utils/authUtilities.ts";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);

    res.cookie("accessToken", result.accessToken, cookieOptsShort);
    res.cookie("refreshToken", result.refreshToken, cookieOptsLong);

    return res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(401).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  try {
    const result = await authService.refreshUserToken(refreshToken || "");

    res.cookie("accessToken", result.accessToken, cookieOptsShort);
    res.cookie("refreshToken", result.refreshToken, cookieOptsLong);

    return res.json({ accessToken: result.accessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = (req: Request, res: Response) => {
  const { id } = (req as any).user ?? {};
  authService.logoutUser(id);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out successfully" });
};

export const forgetPassword = async (_req: Request, _res: Response) => {
  return _res.json({ message: "Password reset functionality not implemented" });
};
