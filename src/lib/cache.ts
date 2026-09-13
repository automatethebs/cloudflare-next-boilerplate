/**
 * Cache API helper — free, no binding, no card.
 * Only active inside the Worker runtime (`wrangler dev` / preview / prod);
 * plain `next dev` (Node) skips caching and just computes.
 * Cache hits don't consume Worker CPU time — use for public GET responses.
 */

function cacheStore(): Cache | null {
  try {
    return typeof caches !== "undefined" && (caches as any).default ? (caches as any).default : null;
  } catch {
    return null;
  }
}

export async function cachedResponse(
  key: string | Request,
  maxAgeSeconds: number,
  compute: () => Promise<Response>,
): Promise<Response> {
  const store = cacheStore();
  if (!store) return compute();
  const cacheKey = typeof key === "string" ? new Request(key) : key;
  try {
    const hit = await store.match(cacheKey);
    if (hit) return hit;
  } catch {
    /* fall through to compute */
  }
  const fresh = await compute();
  try {
    const toStore = fresh.clone();
    const headers = new Headers(toStore.headers);
    headers.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
    await store.put(cacheKey, new Response(toStore.body, { ...toStore, headers }));
  } catch {
    /* caching must never break the response */
  }
  return fresh;
}

export async function bustCache(key: string | Request): Promise<void> {
  const store = cacheStore();
  if (!store) return;
  try {
    await store.delete(typeof key === "string" ? new Request(key) : key);
  } catch {
    /* ignore */
  }
}
