import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { getLocalD1 } from "./d1";

async function main() {
  const { db, dispose } = await getLocalD1();
  try {
    // Connectivity smoke: runs against local SQLite in dev/test,
    // against D1 when OpenNext dev bindings are ready.
    const rows = (await db.all(sql`SELECT 1 AS ok`)) as unknown as Array<{ ok: number }>;
    assert.equal(rows[0]?.ok, 1, "expected SELECT 1 to return ok=1");
    console.log("d1 local smoke passed");
  } finally {
    await dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
