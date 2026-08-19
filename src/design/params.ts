import type { RetroFadeParams } from "@/src/filter/RetroFade";

/** Slider metadata for the 7 RetroFade uniforms (keys match `RetroFadeParams`). */
export type FilmParamSpec = {
  key: keyof RetroFadeParams;
  label: string;
  min: number;
  max: number;
  step: number;
};

export const FILM_PARAMS: FilmParamSpec[] = [
  { key: "warmth", label: "Warmth", min: -0.2, max: 0.3, step: 0.01 },
  { key: "blackLift", label: "Fade", min: 0, max: 0.3, step: 0.01 },
  { key: "highlightRolloff", label: "Highlight", min: 0.7, max: 1, step: 0.01 },
  { key: "contrast", label: "Contrast", min: 0.6, max: 1.4, step: 0.01 },
  { key: "saturation", label: "Saturation", min: 0, max: 1.5, step: 0.01 },
  { key: "vignette", label: "Vignette", min: 0, max: 0.8, step: 0.01 },
  { key: "grain", label: "Grain", min: 0, max: 0.2, step: 0.01 },
];
