import {
  FilterMode,
  ImageFormat,
  MipmapMode,
  Skia,
  TileMode,
} from "@shopify/react-native-skia";
import type { StampDesign } from "@/src/design/types";
import { STAMP_PHOTO_ASPECT } from "@/src/design/types";
import { writeRenderedFile } from "@/src/lib/files";
import { retroFadeUniforms, source } from "./RetroFade";

/** Cap the long edge of the rendered output to bound memory. */
const MAX_EDGE = 2048;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type RenderStampArgs = {
  id: string;
  /** Version tag (usually a timestamp) — makes the output filename unique. */
  version: number;
  sourceUri: string;
  design: StampDesign;
};

/**
 * Render the composite photo shown inside the stamp: the original photo, cropped
 * (zoom/pan), graded through the RetroFade film shader, written to a versioned
 * JPEG. Text baking is added in M5. Returns the new file uri.
 * (The perforated frame + date label are drawn separately by StampPaper.)
 */
export async function renderStamp({
  id,
  version,
  sourceUri,
  design,
}: RenderStampArgs): Promise<string> {
  const data = await Skia.Data.fromURI(sourceUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error("Failed to decode the source photo.");

  const imgW = image.width();
  const imgH = image.height();

  // Output at the fixed stamp-window aspect, long edge capped.
  const outH = Math.min(MAX_EDGE, Math.max(imgW, imgH));
  const outW = Math.round(outH * STAMP_PHOTO_ASPECT);

  const surface = Skia.Surface.MakeOffscreen(outW, outH);
  if (!surface) throw new Error("Failed to create an offscreen Skia surface.");

  // Cover-fit the source into the output, then apply the user's zoom/pan.
  const coverScale = Math.max(outW / imgW, outH / imgH);
  const s = coverScale * Math.max(1, design.crop.scale);
  const drawW = imgW * s;
  const drawH = imgH * s;
  const baseX = (outW - drawW) / 2;
  const baseY = (outH - drawH) / 2;
  const maxPanX = Math.max(0, (drawW - outW) / 2);
  const maxPanY = Math.max(0, (drawH - outH) / 2);
  const tx = baseX + clamp(design.crop.offsetX, -1, 1) * maxPanX;
  const ty = baseY + clamp(design.crop.offsetY, -1, 1) * maxPanY;

  const matrix = Skia.Matrix();
  matrix.translate(tx, ty);
  matrix.scale(s, s);
  const imageShader = image.makeShaderOptions(
    TileMode.Decal,
    TileMode.Decal,
    FilterMode.Linear,
    MipmapMode.None,
    matrix,
  );
  const shader = source.makeShaderWithChildren(
    retroFadeUniforms(outW, outH, design.film),
    [imageShader],
  );
  const paint = Skia.Paint();
  paint.setShader(shader);

  const canvas = surface.getCanvas();
  canvas.drawPaint(paint);
  // M5: bake design.texts here (Skia.Font + drawText).

  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, 92);
  if (!bytes || bytes.length === 0) {
    throw new Error("Failed to encode the rendered stamp.");
  }
  return writeRenderedFile(`${id}-${version}.jpg`, bytes);
}
