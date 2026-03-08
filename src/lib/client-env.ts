// Client-side environment configuration
// Only uses NEXT_PUBLIC_ variables which are safe on the client
export const clientEnv = {
  WA_SERVICE_URL: process.env.NEXT_PUBLIC_WA_SERVICE_URL || "http://localhost:3001",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;
