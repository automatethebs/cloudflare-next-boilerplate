interface CloudflareEnv {
  DB: import("@cloudflare/workers-types").D1Database;
  ASSETS: { fetch: typeof fetch };
  WORKER_SELF_REFERENCE: { fetch: typeof fetch };
  // Workers AI — free 10,000 Neurons/day, no card. Always available.
  AI: import("@cloudflare/workers-types").Ai;
  // Queue producer — auto-created on deploy. Free 10,000 ops/day, no card.
  BACKGROUND: import("@cloudflare/workers-types").Queue;
  // KV — only when the commented kv_namespaces block in wrangler.jsonc is enabled.
  CACHE?: import("@cloudflare/workers-types").KVNamespace;
}
