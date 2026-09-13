/**
 * Read a Cloudflare binding (KV, AI, Queue, …) from the request context.
 * Returns null during `next build`, in plain `next dev` without OpenNext
 * bindings, or when the binding is not configured — callers must fall back.
 */
export async function getBinding<T>(name: string): Promise<T | null> {
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-production-compile") {
    return null;
  }
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctxPromise = (async () => {
      try {
        const { env } = await getCloudflareContext({ async: true } as any);
        return ((env as unknown as Record<string, unknown> | undefined)?.[name] as T) ?? null;
      } catch {
        return null;
      }
    })();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 800));
    return await Promise.race([ctxPromise, timeoutPromise]);
  } catch {
    return null;
  }
}
