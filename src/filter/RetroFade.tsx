import React from "react";
import {
  Canvas,
  Fill,
  Shader,
  ImageShader,
  Skia,
  useImage,
} from "@shopify/react-native-skia";

/**
 * 70s faded film look, as a Skia SkSL runtime shader (dev-plan Appendix A).
 * Each uniform maps to exactly ONE visual move. Runs on the GPU.
 * Requires a dev build (react-native-skia is a native module; not Expo Go).
 *
 * `source` is exported so the headless pipeline (applyFilter.ts) can feed it an
 * image shader imperatively; `RetroFadeImage` is the declarative live preview.
 */
export const source = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float2 resolution;

uniform float warmth;            // amber cast: red up, blue down
uniform float blackLift;         // how gray the shadows get (the soul of the fade)
uniform float highlightRolloff;  // whites become cream instead of pure white
uniform float contrastAmt;       // <1 = softer, flatter
uniform float saturationAmt;     // slightly muted, warm tones survive
uniform float vignetteAmt;       // subtle edge darkening
uniform float grainAmt;          // fine film grain

float hash(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

half4 main(float2 coord) {
  half4 src = image.eval(coord);
  float3 col = float3(src.rgb);

  // 1. Contrast around mid-gray
  col = (col - 0.5) * contrastAmt + 0.5;

  // 2. Saturation (mix toward luminance)
  float luma = dot(col, float3(0.299, 0.587, 0.114));
  col = mix(float3(luma), col, saturationAmt);

  // 3. Tone curve: lift blacks + roll off highlights -> the faded core
  col = blackLift + col * (highlightRolloff - blackLift);

  // 4. Warm amber cast
  col.r += warmth * 0.5;
  col.b -= warmth * 0.5;
  col += float3(warmth * 0.15, warmth * 0.07, 0.0);

  // 5. Subtle vignette
  float2 uv = coord / resolution;
  float2 d = uv - 0.5;
  float vig = 1.0 - vignetteAmt * dot(d, d) * 2.0;
  col *= vig;

  // 6. Fine film grain
  float g = (hash(uv * resolution) - 0.5) * grainAmt;
  col += g;

  col = clamp(col, 0.0, 1.0);
  return half4(half3(col), src.a);
}
`)!;

export type RetroFadeParams = {
  warmth: number;
  blackLift: number;
  highlightRolloff: number;
  contrast: number;
  saturation: number;
  vignette: number;
  grain: number;
};

/** Solid starting point for the 70s faded vibe. Trust your eye from here. */
export const SEVENTIES_FADE: RetroFadeParams = {
  warmth: 0.06,
  blackLift: 0.12,
  highlightRolloff: 0.92,
  contrast: 0.88,
  saturation: 0.82,
  vignette: 0.35,
  grain: 0.08,
};

/**
 * Flatten params into the uniform array in SkSL declaration order.
 * NOTE: `image` is a child shader, not part of this array.
 */
export function retroFadeUniforms(
  width: number,
  height: number,
  params: RetroFadeParams,
): number[] {
  return [
    width,
    height,
    params.warmth,
    params.blackLift,
    params.highlightRolloff,
    params.contrast,
    params.saturation,
    params.vignette,
    params.grain,
  ];
}

type Props = {
  uri: string;
  width: number;
  height: number;
  params?: RetroFadeParams;
};

export function RetroFadeImage({
  uri,
  width,
  height,
  params = SEVENTIES_FADE,
}: Props) {
  const image = useImage(uri);
  if (!image) return null;

  const uniforms = {
    resolution: [width, height],
    warmth: params.warmth,
    blackLift: params.blackLift,
    highlightRolloff: params.highlightRolloff,
    contrastAmt: params.contrast,
    saturationAmt: params.saturation,
    vignetteAmt: params.vignette,
    grainAmt: params.grain,
  };

  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader source={source} uniforms={uniforms}>
          <ImageShader
            image={image}
            fit="cover"
            rect={{ x: 0, y: 0, width, height }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
}
