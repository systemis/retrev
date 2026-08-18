import { Directory, File, Paths } from "expo-file-system";

/**
 * File helpers using the SDK 57 object-oriented FileSystem API
 * (`File` / `Directory` / `Paths`). Filtered JPEGs are the source of truth on
 * disk; the SQLite row points at the file's `uri` (dev-plan §7.1).
 */

const PHOTOS_DIRNAME = "photos";

/** The `documentDirectory/photos` directory that holds every filtered JPEG. */
export function photosDir(): Directory {
  return new Directory(Paths.document, PHOTOS_DIRNAME);
}

/** Create the photos directory if it does not exist. Safe to call on every launch. */
export function ensurePhotosDir(): void {
  const dir = photosDir();
  if (!dir.exists) dir.create({ intermediates: true });
}

/** Absolute file name on disk for a photo id. */
export function photoFilename(id: string): string {
  return `${id}.jpg`;
}

/**
 * Write JPEG bytes for a photo and return its `file://` uri.
 * Bytes come straight from Skia's `encodeToBytes` — no base64 round-trip.
 * On any failure the partial file is removed so a broken image never persists.
 */
export function writePhotoFile(id: string, bytes: Uint8Array): string {
  ensurePhotosDir();
  const file = new File(photosDir(), photoFilename(id));
  try {
    if (file.exists) file.delete();
    file.create();
    file.write(bytes);
    return file.uri;
  } catch (e) {
    try {
      if (file.exists) file.delete();
    } catch {
      // ignore cleanup failure
    }
    throw e;
  }
}

/** Best-effort delete of a filtered image by its uri. */
export function deletePhotoFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort; a missing file is fine
  }
}

/**
 * Remove any file in the photos directory that has no matching DB row — e.g. a
 * write that crashed mid-flow before its row was inserted (dev-plan §12).
 * `keepFilenames` is the set of `${id}.jpg` names still referenced by the DB.
 */
export function pruneOrphans(keepFilenames: Set<string>): void {
  try {
    const dir = photosDir();
    if (!dir.exists) return;
    for (const entry of dir.list()) {
      if (entry instanceof File && !keepFilenames.has(entry.name)) {
        entry.delete();
      }
    }
  } catch {
    // best-effort cleanup; never block launch
  }
}
