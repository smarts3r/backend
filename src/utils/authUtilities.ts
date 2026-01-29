import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "123589";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "123589";

export const generateAccessToken = (user: any) => {
  return jwt.sign(
    { id: user.id,
      email: user.email,
      role: user.role
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
};

export const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { id: user.id,
      email: user.email,
      role: user.role
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
export const normalize = (value: string) => value.trim().toLowerCase();

export const cookieOptsShort = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000,
};

export const cookieOptsLong = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET };
