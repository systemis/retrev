import type { SQLiteDatabase } from "expo-sqlite";
import type { RetroFadeParams } from "@/src/filter/RetroFade";
import { deletePhotoFile } from "@/src/lib/files";

/** A persisted, filtered photo. `params` is the RetroFade look used to make it. */
export type PhotoRecord = {
  id: string;
  uri: string;
  createdAt: number;
  params: RetroFadeParams;
};

type PhotoRow = {
  id: string;
  uri: string;
  created_at: number;
  params: string;
};

function fromRow(row: PhotoRow): PhotoRecord {
  return {
    id: row.id,
    uri: row.uri,
    createdAt: row.created_at,
    params: JSON.parse(row.params) as RetroFadeParams,
  };
}

export async function insertPhoto(
  db: SQLiteDatabase,
  record: PhotoRecord,
): Promise<void> {
  await db.runAsync(
    "INSERT INTO photos (id, uri, created_at, params) VALUES (?, ?, ?, ?)",
    record.id,
    record.uri,
    record.createdAt,
    JSON.stringify(record.params),
  );
}

/** All photos, newest first. */
export async function listPhotos(db: SQLiteDatabase): Promise<PhotoRecord[]> {
  const rows = await db.getAllAsync<PhotoRow>(
    "SELECT * FROM photos ORDER BY created_at DESC",
  );
  return rows.map(fromRow);
}

export async function getPhoto(
  db: SQLiteDatabase,
  id: string,
): Promise<PhotoRecord | null> {
  const row = await db.getFirstAsync<PhotoRow>(
    "SELECT * FROM photos WHERE id = ?",
    id,
  );
  return row ? fromRow(row) : null;
}

/** Delete the row and unlink its file. */
export async function deletePhoto(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  const existing = await getPhoto(db, id);
  await db.runAsync("DELETE FROM photos WHERE id = ?", id);
  if (existing) deletePhotoFile(existing.uri);
}
