import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ZIP_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  INTERNAL_ADMIN_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  ZIP_API_KEY: process.env.ZIP_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  INTERNAL_ADMIN_TOKEN: process.env.INTERNAL_ADMIN_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET
});
