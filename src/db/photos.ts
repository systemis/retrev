import type { SQLiteDatabase } from "expo-sqlite";
import { legacyDesign } from "@/src/design/presets";
import type { StampDesign } from "@/src/design/types";
import { deleteFileAt } from "@/src/lib/files";

/** A persisted stamp: rendered `uri`, its `sourceUri` original, and the `design`. */
export type PhotoRecord = {
  id: string;
  uri: string;
  sourceUri: string;
  createdAt: number;
  updatedAt: number;
  design: StampDesign;
};

type PhotoRow = {
  id: string;
  uri: string;
  source_uri: string | null;
  created_at: number;
  updated_at: number | null;
  design: string | null;
};

function fromRow(row: PhotoRow): PhotoRecord {
  return {
    id: row.id,
    uri: row.uri,
    sourceUri: row.source_uri ?? row.uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    design: row.design
      ? (JSON.parse(row.design) as StampDesign)
      : legacyDesign(),
  };
}

export async function insertPhoto(
  db: SQLiteDatabase,
  record: PhotoRecord,
): Promise<void> {
  await db.runAsync(
    "INSERT INTO photos (id, uri, source_uri, created_at, updated_at, design) VALUES (?, ?, ?, ?, ?, ?)",
    record.id,
    record.uri,
    record.sourceUri,
    record.createdAt,
    record.updatedAt,
    JSON.stringify(record.design),
  );
}

/** Update a stamp after a re-render (new rendered uri + edited design). */
export async function updatePhoto(
  db: SQLiteDatabase,
  id: string,
  patch: { uri: string; design: StampDesign; updatedAt: number },
): Promise<void> {
  await db.runAsync(
    "UPDATE photos SET uri = ?, design = ?, updated_at = ? WHERE id = ?",
    patch.uri,
    JSON.stringify(patch.design),
    patch.updatedAt,
    id,
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

/** Delete the row and unlink both its rendered file and its original. */
export async function deletePhoto(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  const existing = await getPhoto(db, id);
  await db.runAsync("DELETE FROM photos WHERE id = ?", id);
  if (existing) {
    deleteFileAt(existing.uri);
    deleteFileAt(existing.sourceUri);
  }
}
