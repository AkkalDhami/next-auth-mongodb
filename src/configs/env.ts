import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.url(),

  LOG_LEVEL: z
    .enum(["silent", "error", "warn", "info", "debug", "trace"])
    .default(process.env.NODE_ENV === "production" ? "info" : "debug"),
  NEXTAUTH_SECRET: z.string(),

  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_SECRET: z.string(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string(),
  EMAIL_FROM: z.email(),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;
