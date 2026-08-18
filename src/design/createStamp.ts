import { File } from "expo-file-system";
import type { PhotoRecord } from "@/src/db/photos";
import { renderStamp } from "@/src/filter/renderStamp";
import { writeOriginalFile } from "@/src/lib/files";
import { uuid } from "@/src/lib/id";
import { defaultDesign } from "./presets";

/**
 * Turn a raw capture into a persisted stamp: save the untouched original, apply
 * the default design, render the composite, and return the record (the caller
 * writes the DB row via the store). Replaces the old one-shot `applyFilter`.
 */
export async function createStampFromCapture(
  rawUri: string,
): Promise<PhotoRecord> {
  const id = uuid();

  // Persist the untouched capture as the re-edit source of truth.
  const buffer = await new File(rawUri).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const sourceUri = writeOriginalFile(id, bytes);

  const design = defaultDesign();
  const now = Date.now();
  const uri = await renderStamp({ id, version: now, sourceUri, design });

  return { id, uri, sourceUri, design, createdAt: now, updatedAt: now };
}
