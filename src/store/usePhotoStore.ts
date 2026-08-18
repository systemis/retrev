import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";
import {
  deletePhoto,
  getPhoto,
  insertPhoto,
  listPhotos,
  type PhotoRecord,
  updatePhoto,
} from "@/src/db/photos";
import type { StampDesign } from "@/src/design/types";
import { renderStamp } from "@/src/filter/renderStamp";
import { basename, deleteFileAt, pruneOrphans } from "@/src/lib/files";

type PhotoStore = {
  /** In-memory mirror of the DB, newest first — the grid renders from this. */
  photos: PhotoRecord[];
  /** False until the first load resolves (drives the initial empty gate). */
  hydrated: boolean;
  /** Id of the most recently added stamp, for the one-time "drop + settle". */
  newestId: string | null;

  /** Load all rows from the DB and prune orphaned files. Call once on mount. */
  load: (db: SQLiteDatabase) => Promise<void>;
  /** Persist a freshly created record and prepend it to the list. */
  add: (db: SQLiteDatabase, record: PhotoRecord) => Promise<void>;
  /** Re-render a stamp with an edited design, persist, and replace it in the list. */
  update: (
    db: SQLiteDatabase,
    id: string,
    design: StampDesign,
  ) => Promise<void>;
  /** Delete a record + its files and drop it from the list. */
  remove: (db: SQLiteDatabase, id: string) => Promise<void>;
  /** Clear the new-stamp emphasis flag once its drop animation has played. */
  clearNewest: () => void;
};

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  hydrated: false,
  newestId: null,

  load: async (db) => {
    const photos = await listPhotos(db);
    pruneOrphans(
      new Set(photos.map((p) => basename(p.uri))),
      new Set(photos.map((p) => basename(p.sourceUri))),
    );
    set({ photos, hydrated: true });
  },

  add: async (db, record) => {
    await insertPhoto(db, record);
    set((s) => ({ photos: [record, ...s.photos], newestId: record.id }));
  },

  update: async (db, id, design) => {
    const existing = get().photos.find((p) => p.id === id) ?? (await getPhoto(db, id));
    if (!existing) return;
    const updatedAt = Date.now();
    const uri = await renderStamp({
      id,
      version: updatedAt,
      sourceUri: existing.sourceUri,
      design,
    });
    await updatePhoto(db, id, { uri, design, updatedAt });
    // Drop the previous rendered file so it doesn't linger.
    if (existing.uri !== uri) deleteFileAt(existing.uri);
    set((s) => ({
      photos: s.photos.map((p) =>
        p.id === id ? { ...p, uri, design, updatedAt } : p,
      ),
    }));
  },

  remove: async (db, id) => {
    await deletePhoto(db, id);
    set((s) => ({
      photos: s.photos.filter((p) => p.id !== id),
      newestId: s.newestId === id ? null : s.newestId,
    }));
  },

  clearNewest: () => set({ newestId: null }),
}));
