import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getD1 } from "@/lib/db/d1";

function tableNames(raw: unknown): string[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { results?: unknown }).results)
      ? ((raw as { results: unknown[] }).results ?? [])
      : [];
  return rows
    .map((r) => (r && typeof r === "object" && "name" in r ? String((r as { name: unknown }).name) : ""))
    .filter(Boolean);
}

export async function GET() {
  try {
    const db = await getD1();
    const raw = (await db.all(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )) as unknown;
    return NextResponse.json({ ok: true, tables: tableNames(raw) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
