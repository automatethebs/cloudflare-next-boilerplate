import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  sqliteDrizzle?: ReturnType<typeof drizzle<typeof schema>>;
};

function dbFile() {
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "d1.sqlite");
}

/** Node-only. Do not import from Worker/OpenNext request paths. */
export function getSqliteDb() {
  if (!globalForDb.sqliteDrizzle) {
    const sqlite = new Database(dbFile());
    sqlite.pragma("journal_mode = WAL");
    // Next/OpenNext can initialize the local database concurrently in dev.
    // Wait briefly for the migration/schema writer instead of failing with SQLITE_BUSY.
    sqlite.pragma("busy_timeout = 10000");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    globalForDb.sqlite = sqlite;
    globalForDb.sqliteDrizzle = db;
  }
  return globalForDb.sqliteDrizzle;
}
