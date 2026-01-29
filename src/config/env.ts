import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "JWT_REFRESH_EXPIRES_IN",
  "JWT_ACCESS_EXPIRES_IN",
] as const;

// Optional environment variables with defaults
const envVars = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // JWT
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // CORS
  CORS_ORIGIN:
    process.env.NODE_ENV === "production"
      ? process.env.CORS_ORIGIN || "https://yourdomain.com"
      : process.env.CORS_ORIGIN || "http://localhost:5173",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // File Upload (Cloudinary/AWS S3)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // AWS S3 (alternative to Cloudinary)
  AWS_REGION: process.env.AWS_REGION || "",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "",

  // Email (optional)
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",

  // Redis (optional, for session management)
  REDIS_URL: process.env.REDIS_URL || "",
} as const;

// Validate required environment variables
const validateEnv = (): void => {
  const missingVars = requiredEnvVars.filter(
    (varName) => !envVars[varName as keyof typeof envVars],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set.",
    );
  }

  // Validate JWT secrets are not the default fallback values
  if (
    envVars.ACCESS_TOKEN_SECRET === "123589" ||
    envVars.REFRESH_TOKEN_SECRET === "123589"
  ) {
    throw new Error(
      "JWT secrets cannot use default fallback values. Please set secure secrets in your environment variables.",
    );
  }

  // Validate numeric values
  if (isNaN(envVars.PORT) || envVars.PORT < 1 || envVars.PORT > 65535) {
    throw new Error("PORT must be a valid port number (1-65535)");
  }

  if (
    isNaN(envVars.SMTP_PORT) ||
    envVars.SMTP_PORT < 1 ||
    envVars.SMTP_PORT > 65535
  ) {
    throw new Error("SMTP_PORT must be a valid port number (1-65535)");
  }

  console.log("✅ Environment variables validated successfully");
};

// Export validated environment variables
export const config = Object.freeze(envVars);

// Run validation immediately when module is imported
validateEnv();

export default config;
