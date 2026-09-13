import type { Queue } from "@cloudflare/workers-types";
import { getBinding } from "./cloudflare-env";

/**
 * Background jobs via Queues (binding BACKGROUND → queue my-app-background).
 * Free tier: 10,000 ops/day, 24h retention — no card required.
 * The queue is auto-created on first deploy.
 *
 * NOTE: queue *consumers* cannot live in this OpenNext worker (it only
 * exports `fetch`). See workers/companion for the consumer. Until the
 * companion is deployed, sent messages expire harmlessly after 24h.
 */

export type Job = { type: string; [key: string]: unknown };

export async function enqueue(job: Job): Promise<boolean> {
  const queue = await getBinding<Queue>("BACKGROUND");
  if (!queue) return false;
  try {
    await queue.send(job);
    return true;
  } catch {
    return false;
  }
}
