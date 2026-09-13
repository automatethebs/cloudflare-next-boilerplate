/**
 * OPTIONAL companion worker — deploy only if you need cron relay, queue
 * consumption, Durable Objects, or Workflows.
 *
 * None of these can live in the OpenNext worker (it only exports `fetch`),
 * so they live here. Everything used is free without a payment method:
 * Cron Triggers, Queues, SQLite-backed Durable Objects, Workflows.
 *
 * Deploy (after the main app, so the queue exists):
 *   wrangler deploy --config workers/companion/wrangler.jsonc
 * Secrets:
 *   wrangler secret put CRON_SECRET --config workers/companion/wrangler.jsonc
 *   (APP_URL is already in vars above — set it to your live domain.)
 */
import { DurableObject, WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

interface Env {
  APP_URL: string;
  CRON_SECRET: string;
  RATE_LIMITER: DurableObjectNamespace;
  BACKGROUND_WORKFLOW: Workflow;
}

type Job = { type: string; [key: string]: unknown };

export default {
  /**
   * Cron Trigger → relay to the Next app's protected cron endpoint.
   * The app verifies Bearer CRON_SECRET (see src/lib/cron.ts).
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const res = await fetch(`${env.APP_URL}/api/cron/heartbeat`, {
          headers: { authorization: `Bearer ${env.CRON_SECRET}` },
        });
        console.log(JSON.stringify({ event: "cron.relay", status: res.status }));
      })(),
    );
  },

  /** Queue consumer for the `my-app-background` queue (see src/lib/queue.ts). */
  async queue(batch: MessageBatch<Job>, _env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await handleJob(msg.body);
        msg.ack();
      } catch (err) {
        console.log(JSON.stringify({ event: "queue.error", error: err instanceof Error ? err.message : String(err) }));
        msg.retry();
      }
    }
  },
};

async function handleJob(job: Job): Promise<void> {
  switch (job.type) {
    case "log":
      console.log(JSON.stringify({ event: "job.log", job }));
      break;
    default:
      console.log(JSON.stringify({ event: "job.unknown", type: job.type }));
  }
}

/** Example SQLite-backed Durable Object (free tier). Per-key rate limiter. */
export class RateLimiter extends DurableObject<Env> {
  async check(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number }> {
    const now = Date.now();
    const record = await this.ctx.storage.get<{ count: number; resetAt: number }>(key);
    if (!record || record.resetAt <= now) {
      await this.ctx.storage.put(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { ok: true, remaining: limit - 1 };
    }
    if (record.count >= limit) return { ok: false, remaining: 0 };
    record.count += 1;
    await this.ctx.storage.put(key, record);
    return { ok: true, remaining: limit - record.count };
  }
}

/** Example Workflow (free tier: 3,000 steps/day). Extend with real steps. */
export class BackgroundWorkflow extends WorkflowEntrypoint<Env, Job> {
  async run(event: WorkflowEvent<Job>, step: WorkflowStep): Promise<unknown> {
    const job = event.payload;
    const validated = await step.do("validate", async () => ({ type: job.type, at: new Date().toISOString() }));
    await step.sleep("wait", "10 seconds");
    return step.do("finish", async () => ({ ...validated, done: true }));
  }
}
