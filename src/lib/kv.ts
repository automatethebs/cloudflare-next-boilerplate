import type { KVNamespace } from "@cloudflare/workers-types";
import { getBinding } from "./cloudflare-env";

/**
 * Optional KV cache (binding CACHE).
 * Free tier: 100k reads/day, 1k writes/day, 1GB — no card required.
 * Design write-light: reads are cheap, writes are precious.
 *
 * Works with zero config in `next dev` via an in-memory fallback.
 * To enable real KV: `npx wrangler kv namespace create CACHE`,
 * paste the id into wrangler.jsonc (uncomment kv_namespaces).
 */

type MemEntry = { value: string; expiresAt?: number };
const mem = new Map<string, MemEntry>();

async function ns(): Promise<KVNamespace | null> {
  return getBinding<KVNamespace>("CACHE");
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const namespace = await ns();
  if (namespace) {
    try {
      return await namespace.get<T>(key, "json");
    } catch {
      return null;
    }
  }
  const hit = mem.get(key);
  if (!hit) return null;
  if (hit.expiresAt && hit.expiresAt < Date.now()) {
    mem.delete(key);
    return null;
  }
  try {
    return JSON.parse(hit.value) as T;
  } catch {
    return null;
  }
}

export async function kvPut(key: string, value: unknown, opts?: { expirationTtl?: number }): Promise<void> {
  const namespace = await ns();
  if (namespace) {
    try {
      await namespace.put(key, JSON.stringify(value), opts?.expirationTtl ? { expirationTtl: opts.expirationTtl } : undefined);
    } catch {
      /* KV write limits are tiny — never let caching break the request. */
    }
    return;
  }
  mem.set(key, {
    value: JSON.stringify(value),
    expiresAt: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined,
  });
}

export async function kvDelete(key: string): Promise<void> {
  const namespace = await ns();
  if (namespace) {
    try {
      await namespace.delete(key);
    } catch {
      /* ignore */
    }
    return;
  }
  mem.delete(key);
}
