import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { log } from "@/lib/log";

/**
 * Example scheduled job endpoint. Triggered by cron-job.org (free, no card)
 * or workers/companion's scheduled relay — both send Bearer CRON_SECRET.
 * Keep it fast (<10s) and idempotent. Add your work where marked.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const at = new Date().toISOString();
  // TODO: add scheduled work here (D1 queries, queue sends, AI calls).
  log("cron.heartbeat", {});
  return NextResponse.json({ ok: true, at });
}
