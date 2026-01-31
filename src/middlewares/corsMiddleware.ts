import cors from "cors";

export const corsMiddleware = () => {
  return cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CORS_ORIGIN || "https://your-production-url.com"
        : true,
    credentials: true,
  });
};
