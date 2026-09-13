import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(raw);
}

export const env = parseEnv();
