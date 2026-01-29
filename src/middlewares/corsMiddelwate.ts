import cors from "cors";

export const corsMiddleware = () => {
  return cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https:
        : true,
    credentials: true,
  });
};
