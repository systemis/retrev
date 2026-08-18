import { writePhotoFile } from "@/src/lib/files";
import { uuid } from "@/src/lib/id";
import {
  FilterMode,
  ImageFormat,
  MipmapMode,
  Skia,
  TileMode,
} from "@shopify/react-native-skia";
import {
  retroFadeUniforms,
  SEVENTIES_FADE,
  source,
  type RetroFadeParams,
} from "./RetroFade";

/** Cap the long edge to bound memory on large sensors (dev-plan §8). */
const MAX_EDGE = 2048;

export type FilterResult = {
  id: string;
  uri: string;
  createdAt: number;
  params: RetroFadeParams;
};

/**
 * Render a raw capture through the RetroFade shader entirely offscreen, encode
 * the result to a JPEG on disk, and return the new record (the caller writes the
 * DB row so DB access stays in the store). Headless — no mounted Canvas needed.
 *
 * Pipeline (dev-plan §8): decode raw → offscreen surface at target res →
 * image shader (scaled to fill) fed through the effect → snapshot →
 * encodeToBytes(JPEG) → File.write.
 */
export async function applyFilter(
  rawUri: string,
  params: RetroFadeParams = SEVENTIES_FADE,
): Promise<FilterResult> {
  // 1. Decode the raw photo into a Skia image.
  const data = await Skia.Data.fromURI(rawUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error("Failed to decode the captured photo.");

  const imgW = image.width();
  const imgH = image.height();
  const scale = Math.min(1, MAX_EDGE / Math.max(imgW, imgH));
  const targetW = Math.max(1, Math.round(imgW * scale));
  const targetH = Math.max(1, Math.round(imgH * scale));

  // 2. Offscreen surface at exactly the target resolution.
  const surface = Skia.Surface.MakeOffscreen(targetW, targetH);
  if (!surface) throw new Error("Failed to create an offscreen Skia surface.");

  // 3. Image shader scaled to fill the surface, fed through the RetroFade effect.
  const matrix = Skia.Matrix();
  matrix.scale(scale, scale);
  const imageShader = image.makeShaderOptions(
    TileMode.Decal,
    TileMode.Decal,
    FilterMode.Linear,
    MipmapMode.None,
    matrix,
  );
  const shader = source.makeShaderWithChildren(
    retroFadeUniforms(targetW, targetH, params),
    [imageShader],
  );
  const paint = Skia.Paint();
  paint.setShader(shader);

  // 4. Draw the full surface, flush, snapshot, encode.
  const canvas = surface.getCanvas();
  canvas.drawPaint(paint);
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, 95);
  if (!bytes || bytes.length === 0) {
    throw new Error("Failed to encode the filtered image.");
  }

  // 5. Persist the file (self-cleans on write failure).
  const id = uuid();
  const uri = writePhotoFile(id, bytes);
  return { id, uri, createdAt: Date.now(), params };
}
