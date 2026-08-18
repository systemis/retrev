import { Directory, File, Paths } from "expo-file-system";

/**
 * File helpers using the SDK 57 object-oriented FileSystem API.
 * Two directories under documentDirectory:
 *   - `originals/<id>.jpg`            the untouched capture (source of truth for re-edits)
 *   - `photos/<id>-<version>.jpg`     the rendered composite shown in the stamp
 * Rendered files are versioned so image caches refresh after a re-edit.
 */

const PHOTOS_DIRNAME = "photos";
const ORIGINALS_DIRNAME = "originals";

export function photosDir(): Directory {
  return new Directory(Paths.document, PHOTOS_DIRNAME);
}
export function originalsDir(): Directory {
  return new Directory(Paths.document, ORIGINALS_DIRNAME);
}

export function ensurePhotosDir(): void {
  const dir = photosDir();
  if (!dir.exists) dir.create({ intermediates: true });
}
export function ensureOriginalsDir(): void {
  const dir = originalsDir();
  if (!dir.exists) dir.create({ intermediates: true });
}

/** Last path segment of a file uri, e.g. `abc-123.jpg`. */
export function basename(uri: string): string {
  return uri.split("/").pop() ?? uri;
}

function writeInto(dir: Directory, filename: string, bytes: Uint8Array): string {
  const file = new File(dir, filename);
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

/** Persist the untouched capture. */
export function writeOriginalFile(id: string, bytes: Uint8Array): string {
  ensureOriginalsDir();
  return writeInto(originalsDir(), `${id}.jpg`, bytes);
}

/** Write a rendered composite under an already-versioned filename. */
export function writeRenderedFile(filename: string, bytes: Uint8Array): string {
  ensurePhotosDir();
  return writeInto(photosDir(), filename, bytes);
}

/** Best-effort delete of any file by its uri. */
export function deleteFileAt(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort; a missing file is fine
  }
}

/**
 * Remove files in `photos/` and `originals/` not referenced by any DB row — e.g.
 * a render that crashed mid-flow, or the previous version of a re-edited stamp.
 * Keep-sets are the exact basenames still referenced (`r.uri` / `r.sourceUri`).
 */
export function pruneOrphans(
  keepPhotoNames: Set<string>,
  keepOriginalNames: Set<string>,
): void {
  pruneDir(photosDir(), keepPhotoNames);
  pruneDir(originalsDir(), keepOriginalNames);
}

function pruneDir(dir: Directory, keep: Set<string>): void {
  try {
    if (!dir.exists) return;
    for (const entry of dir.list()) {
      if (entry instanceof File && !keep.has(entry.name)) {
        entry.delete();
      }
    }
  } catch {
    // best-effort cleanup; never block launch
  }
}
