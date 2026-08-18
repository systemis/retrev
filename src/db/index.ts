import type { SQLiteDatabase } from "expo-sqlite";
import { SCHEMA } from "./schema";

export const DATABASE_NAME = "faded.db";

/**
 * Run migrations. Wired via `<SQLiteProvider databaseName onInit={migrateDb}>`
 * in the root layout so the schema exists before any screen queries.
 */
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA);
}
