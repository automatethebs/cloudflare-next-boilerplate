# cloudflare-next-template

Blank Next.js template fully supported on Cloudflare Workers with full OpenNext integration.

## Stack

- Next.js 16 + React 19, deployed via `@opennextjs/cloudflare` (Workers, not Pages git)
- Cloudflare D1 (SQLite) via `drizzle-orm`, migrations in `drizzle/`
- Tailwind CSS v3 + shadcn/new-york setup (`components.json`, `@/*` alias)
- Wrangler 4, `nodejs_compat` + `global_fetch_strictly_public`

## Included Cloudflare services — all free, no payment method

Every service below works on a plain free Cloudflare account (no credit card).
Verified limits (Workers Free plan, docs current Sep 2026):

| Service | Free limit | Template status | Code |
|---|---|---|---|
| Workers + Static Assets | 100k req/day, 20k files | Active default | — |
| D1 | 5M rows read/day, 100k written/day, 5GB | Active default | `src/lib/db/` |
| KV | 100k reads/day, 1k writes/day, 1GB | Opt-in: 1 command, then uncomment binding | `src/lib/kv.ts` (memory fallback until then) |
| Queues (producer) | 10k ops/day, 24h retention | Active: queue auto-created on deploy | `src/lib/queue.ts` |
| Workers AI | 10k Neurons/day | Active, no setup | `src/lib/ai.ts` |
| Cache API | Free, no binding | Active helper | `src/lib/cache.ts` |
| Turnstile | 20 widgets/account | Component + verifier, needs keys | `src/components/turnstile.tsx`, `src/lib/turnstile.ts` |
| Cron endpoint | Via cron-job.org (free) | Active route, needs `CRON_SECRET` + schedule | `src/app/api/cron/heartbeat/` |
| Workers Logs | 200k events/day, 3-day retention | Convention | `src/lib/log.ts` |
| Cron relay, queue consumer, Durable Objects, Workflows | Same free tiers | Optional 2nd worker | `workers/companion/` |

Deliberately excluded: **R2** (dashboard forces a payment method even for the
free tier), **Vectorize / Images / Stream** (paid-only).

### Why no `triggers.crons`, DOs, or Workflows in the main worker?

Verified in the built `.open-next/worker.js`: the OpenNext entrypoint exports
only `fetch` — no `scheduled` handler, no queue consumer, no custom class
exports. So `scheduled` handlers, queue consumers, Durable Object classes, and
Workflow classes **cannot live in this worker**. The template handles that two ways:

1. **Cron as HTTP** — `/api/cron/*` routes protected by `CRON_SECRET`
   (`src/lib/cron.ts`). Trigger them with cron-job.org (free, no card:
   create account → Add cron job → URL `https://YOUR-DOMAIN/api/cron/heartbeat`
   → header `Authorization: Bearer <CRON_SECRET>`), or:
2. **`workers/companion`** — an optional tiny second worker (same free tiers)
   holding the cron relay, the queue consumer, an example `RateLimiter`
   Durable Object, and an example Workflow. Deploy manually *after* the main
   app (so the queue exists):
   `wrangler deploy --config workers/companion/wrangler.jsonc`
   (+ `wrangler secret put CRON_SECRET --config workers/companion/wrangler.jsonc`,
   and set `APP_URL` in its vars). Only the main app worker handles public traffic.

## Deployment Architecture & Requirements

Keep these true for reliable Cloudflare deployments:

1. `package.json` keeps `next` + `@opennextjs/cloudflare` deps and `opennext` in `deploy`/`preview` scripts.
2. `wrangler.jsonc` exists with `main: .open-next/worker.js`, `assets` binding `ASSETS`, and
   `d1_databases[0]` = `{ binding: "DB", migrations_dir: "drizzle" }`. Update `name` and
   `database_id` per project.
3. `open-next.config.ts` keeps the `--webpack` build command (Next 16 Turbopack crashes on Windows prerender)
   and `useWorkerdCondition: false` (Better Auth file-tracing fix).
4. `drizzle/meta/_journal.json` + `drizzle/*.sql` — applied to a fresh D1 via drizzle/wrangler.
   After editing `src/lib/db/schema.ts`, run `npm run db:generate` and commit the new files.
5. `.env.example` — keep `KEY=value` lines with a short `# comment` above each var.
6. `scripts/patch-opennext-windows.cjs` — helper script for Windows build compatibility. Keep it.

## Start a new project

```powershell
# 1. copy the template
Copy-Item -Recurse D:\Projects\cloudflare-next-boilerplate D:\Projects\my-new-app
Set-Location D:\Projects\my-new-app

# 2. rename (3 places): package.json "name", wrangler.jsonc "name" +
#    services[0].service + d1_databases[0].database_name
# 3. install + local db + dev
npm install
copy .env.example .env
# fill in CRON_SECRET (see .env.example)
npm run db:migrate:local
npm run dev
```

Then create a GitHub repo, push, and deploy to Cloudflare Workers.

## Local D1

- `wrangler d1 migrations apply my-app --local` writes to the local D1 store; `src/lib/db/sqlite-local.ts`
  (`.data/d1.sqlite`) is the fallback when OpenNext dev bindings are not ready.
- `npm test` runs the D1 smoke test (tables exist + insert/select/delete round-trip).

## Production

1. `npx wrangler login`
2. `npx wrangler d1 create my-app` → paste `database_id` into `wrangler.jsonc`
3. `npm run db:migrate:remote`
4. `npx wrangler secret put APP_URL|AUTH_SECRET|AUTH_GITHUB_ID|AUTH_GITHUB_SECRET|CRON_SECRET|TURNSTILE_SECRET_KEY`
   (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is build-time: put it in `.dev.vars` or wrangler `vars`.)
5. GitHub OAuth callback = `https://YOUR-DOMAIN/api/auth/callback/github`
6. `npm run deploy`
