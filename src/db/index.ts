import type { SQLiteDatabase } from "expo-sqlite";
import { SCHEMA } from "./schema";

export const DATABASE_NAME = "faded.db";

/** Add a column only if the table doesn't already have it (idempotent upgrade). */
async function addColumnIfMissing(
  db: SQLiteDatabase,
  table: string,
  column: string,
  type: string,
): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  if (!cols.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

/**
 * Migrations, wired via `<SQLiteProvider onInit>`. Fresh installs get the full
 * schema; pre-feature installs are upgraded to carry source_uri/design/updated_at.
 */
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA);

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await addColumnIfMissing(db, "photos", "source_uri", "TEXT");
    await addColumnIfMissing(db, "photos", "updated_at", "INTEGER");
    await addColumnIfMissing(db, "photos", "design", "TEXT");
    // Legacy rows: the stored image is already filtered → its original is itself.
    await db.runAsync(
      "UPDATE photos SET source_uri = uri WHERE source_uri IS NULL",
    );
    await db.runAsync(
      "UPDATE photos SET updated_at = created_at WHERE updated_at IS NULL",
    );
    await db.execAsync("PRAGMA user_version = 1");
  }
}
