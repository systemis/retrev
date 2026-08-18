import { SEVENTIES_FADE, type RetroFadeParams } from "@/src/filter/RetroFade";
import type { CropTransform, FrameConfig, StampDesign } from "./types";

export const DEFAULT_CROP: CropTransform = { scale: 1, offsetX: 0, offsetY: 0 };
export const DEFAULT_FRAME: FrameConfig = { paper: "white", tooth: 4, border: 7 };

/** No-op grade — used for legacy rows whose stored image is already filtered. */
export const IDENTITY_FILM: RetroFadeParams = {
  warmth: 0,
  blackLift: 0,
  highlightRolloff: 1,
  contrast: 1,
  saturation: 1,
  vignette: 0,
  grain: 0,
};

export type FilmPreset = { id: string; label: string; params: RetroFadeParams };

/** One-tap film looks. All map onto the existing RetroFade shader uniforms. */
export const FILM_PRESETS: FilmPreset[] = [
  { id: "seventies", label: "70s Fade", params: SEVENTIES_FADE },
  {
    id: "portra",
    label: "Portra",
    params: {
      warmth: 0.08,
      blackLift: 0.08,
      highlightRolloff: 0.95,
      contrast: 0.95,
      saturation: 0.95,
      vignette: 0.25,
      grain: 0.05,
    },
  },
  {
    id: "cinestill",
    label: "Cinestill",
    params: {
      warmth: 0.03,
      blackLift: 0.06,
      highlightRolloff: 0.98,
      contrast: 1.05,
      saturation: 1.05,
      vignette: 0.3,
      grain: 0.07,
    },
  },
  {
    id: "bw",
    label: "B&W",
    params: {
      warmth: 0,
      blackLift: 0.1,
      highlightRolloff: 0.95,
      contrast: 1.1,
      saturation: 0,
      vignette: 0.35,
      grain: 0.09,
    },
  },
  {
    id: "cool",
    label: "Cool Fade",
    params: {
      warmth: -0.05,
      blackLift: 0.14,
      highlightRolloff: 0.9,
      contrast: 0.85,
      saturation: 0.8,
      vignette: 0.35,
      grain: 0.08,
    },
  },
  {
    id: "vivid",
    label: "Vivid",
    params: {
      warmth: 0.04,
      blackLift: 0.03,
      highlightRolloff: 0.99,
      contrast: 1.15,
      saturation: 1.25,
      vignette: 0.2,
      grain: 0.04,
    },
  },
];

/** Fresh design for a new capture — reproduces today's default 70s look. */
export function defaultDesign(): StampDesign {
  return {
    version: 1,
    presetId: "seventies",
    film: { ...SEVENTIES_FADE },
    crop: { ...DEFAULT_CROP },
    frame: { ...DEFAULT_FRAME },
    label: { enabled: true, format: "dotted" },
    texts: [],
  };
}

/** Design assigned to legacy rows whose image was already filtered (no re-grade). */
export function legacyDesign(): StampDesign {
  return {
    version: 1,
    presetId: null,
    film: { ...IDENTITY_FILM },
    crop: { ...DEFAULT_CROP },
    frame: { ...DEFAULT_FRAME },
    label: { enabled: true, format: "dotted" },
    texts: [],
  };
}
