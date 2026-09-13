import { NextResponse } from "next/server";
import { getD1 } from "@/lib/db/d1";

export async function GET() {
  try {
    const db = await getD1();
    const tables = db.$client
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[];
    return NextResponse.json({ ok: true, tables: tables.map((t) => t.name) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
