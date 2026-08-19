import {
  Fill,
  Group,
  ImageShader,
  Shader,
  type SkImage,
} from "@shopify/react-native-skia";
import type { CropTransform } from "@/src/design/types";
import { type RetroFadeParams, source } from "@/src/filter/RetroFade";
import type { InnerRect } from "@/src/components/stampPath";

type Props = {
  image: SkImage;
  /** Photo window inside the stamp (canvas coords). */
  rect: InnerRect;
  film: RetroFadeParams;
  crop?: CropTransform;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/**
 * Live, GPU film-graded photo for the editor preview — the declarative twin of
 * `renderStamp`'s offscreen pass, drawn inside the stamp window. The crop (zoom
 * relative to cover-fit + normalized pan) is expressed as the cover rect for the
 * image shader, matching `renderStamp` so the preview is WYSIWYG. Translating the
 * group to the window origin keeps the shader's coord space local (0..w).
 */
export function FilmImage({ image, rect, film, crop }: Props) {
  const s = Math.max(1, crop?.scale ?? 1);
  const drawW = rect.width * s;
  const drawH = rect.height * s;
  const cx = (rect.width - drawW) / 2;
  const cy = (rect.height - drawH) / 2;
  const panX = (clamp(crop?.offsetX ?? 0, -1, 1) * (drawW - rect.width)) / 2;
  const panY = (clamp(crop?.offsetY ?? 0, -1, 1) * (drawH - rect.height)) / 2;

  const uniforms = {
    resolution: [rect.width, rect.height],
    warmth: film.warmth,
    blackLift: film.blackLift,
    highlightRolloff: film.highlightRolloff,
    contrastAmt: film.contrast,
    saturationAmt: film.saturation,
    vignetteAmt: film.vignette,
    grainAmt: film.grain,
  };

  return (
    <Group transform={[{ translateX: rect.x }, { translateY: rect.y }]}>
      <Fill>
        <Shader source={source} uniforms={uniforms}>
          <ImageShader
            image={image}
            fit="cover"
            rect={{
              x: cx + panX,
              y: cy + panY,
              width: drawW,
              height: drawH,
            }}
          />
        </Shader>
      </Fill>
    </Group>
  );
}
