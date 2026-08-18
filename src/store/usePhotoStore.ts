import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";
import {
  deletePhoto,
  insertPhoto,
  listPhotos,
  type PhotoRecord,
} from "@/src/db/photos";
import { photoFilename, pruneOrphans } from "@/src/lib/files";

type PhotoStore = {
  /** In-memory mirror of the DB, newest first — the grid renders from this. */
  photos: PhotoRecord[];
  /** False until the first load resolves (drives the initial splash/empty gate). */
  hydrated: boolean;
  /** Id of the most recently added stamp, for the one-time "drop + settle" (§9.1). */
  newestId: string | null;

  /** Load all rows from the DB and prune orphaned files. Call once on mount. */
  load: (db: SQLiteDatabase) => Promise<void>;
  /** Persist a record (already written to disk) and prepend it to the list. */
  add: (db: SQLiteDatabase, record: PhotoRecord) => Promise<void>;
  /** Delete a record + its file and drop it from the list. */
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
    pruneOrphans(new Set(photos.map((p) => photoFilename(p.id))));
    set({ photos, hydrated: true });
  },

  add: async (db, record) => {
    await insertPhoto(db, record);
    set((s) => ({ photos: [record, ...s.photos], newestId: record.id }));
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
