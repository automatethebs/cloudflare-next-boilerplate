import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppD1 = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { d1?: AppD1 };

type EnvWithDb = { DB?: D1Database };

async function fromCloudflare(): Promise<AppD1 | null> {
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-production-compile") {
    return null;
  }
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    // getCloudflareContext({async:true}) can hang for ~60s when OpenNext dev bindings
    // are not yet ready (workerd not started or context not set). Race with a short
    // timeout so local dev falls back to sqlite quickly instead of blocking the request.
    const ctxPromise = (async () => {
      try {
        const { env } = await getCloudflareContext({ async: true } as any);
        return (env as EnvWithDb | undefined)?.DB ?? null;
      } catch {
        return null;
      }
    })();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 800));
    const db = await Promise.race([ctxPromise, timeoutPromise]);
    if (!db) return null;
    return drizzle(db, { schema });
  } catch {
    return null;
  }
}

/** Cloudflare D1 in Workers / `next dev` with OpenNext bindings; SQLite file otherwise. */
export async function getD1(): Promise<AppD1> {
  if (globalForDb.d1) return globalForDb.d1;
  const fromCf = await fromCloudflare();
  if (fromCf) {
    globalForDb.d1 = fromCf;
    return fromCf;
  }
  const { getSqliteDb } = await import("./sqlite-local");
  globalForDb.d1 = getSqliteDb() as unknown as AppD1;
  return globalForDb.d1;
}

export async function getLocalD1() {
  const db = await getD1();
  return { db, dispose: async () => {} };
}
