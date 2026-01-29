import { Role } from "@prisma/client";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  isEmail,
  normalize,
  REFRESH_TOKEN_SECRET,
  verifyToken,
} from "@/utils/authUtilities.ts";
import { prisma } from "../lib/prisma";
import { deleteSession, setSession } from "../services/sessionCache";

export interface RegisterUserData {
  username?: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginCredentials {
  loginIdentifier: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  async registerUser(userData: RegisterUserData) {
    const { username, email, password, role } = userData;

    if (!password || !email) {
      throw new Error("Email and password are required");
    }

    const cleanEmail = normalize(email);
    const cleanUsername = username ? username.trim() : null;

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
      throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        role:
          role &&
          typeof role === "string" &&
          Object.values(Role).includes(role as Role)
            ? (role as Role)
            : Role.USER,
      },
      select: { id: true },
    });

    return {
      success: true,
      message: "User registered successfully",
      userId: user.id,
    };
  }

  async loginUser(credentials: LoginCredentials) {
    const { loginIdentifier, password } = credentials;

    if (!loginIdentifier || !password) {
      throw new Error("Username/Email and password are required");
    }

    const identifier = loginIdentifier.trim();
    const byEmail = isEmail(identifier);

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
        created_at: true,
        updated_at: true,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    const publicUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.username || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    const accessToken = generateAccessToken(publicUser);
    const refreshToken = generateRefreshToken(publicUser);

    setSession(user.id.toString(), publicUser);

    return {
      user: publicUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshUserToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const userData = verifyToken(refreshToken, REFRESH_TOKEN_SECRET);

    const newAccessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  logoutUser(userId?: string) {
    if (userId) {
      deleteSession(userId);
    }
  }
}
