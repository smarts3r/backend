import { getSession, setSession } from "@/services/sessionCache.ts";
import { ACCESS_TOKEN_SECRET, verifyToken } from "@/utils/authUtilities.ts";

const handleUnauthorized = (_req, res, message) => {
  return res
    .status(message === "Access Token Required" ? 401 : 403)
    .json({ message });
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.cookies.accessToken;

  if (!token) {
    return handleUnauthorized(req, res, "Access Token Required");
  }

  try {
    const userData = verifyToken(token, ACCESS_TOKEN_SECRET);
    let user = getSession(userData.id);

    if (!user) {
      user = userData;
      setSession(user.id, user);
    }

    req.user = user;
    next();
  } catch (_err) {
    return handleUnauthorized(req, res, "Invalid or Expired Token");
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
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
