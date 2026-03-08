import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  WA_SERVICE_URL: z.string().url().default("http://localhost:3001"),
});

export const env = envSchema.parse(process.env);
