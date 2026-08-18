import type { RetroFadeParams } from "@/src/filter/RetroFade";

/** Output photo aspect (width / height) the stamp window renders at. */
export const STAMP_PHOTO_ASPECT = 0.8;

export type PaperTint = "white" | "cream" | "kraft";
export type LabelFormat = "dotted" | "slash";
export type TextAlign = "left" | "center" | "right";

/** Zoom + pan of the source photo within the stamp window. */
export type CropTransform = {
  scale: number; // >= 1 (1 = cover-fit)
  offsetX: number; // normalized -1..1
  offsetY: number;
};

export type FrameConfig = {
  paper: PaperTint;
  tooth: number; // perforation tooth radius (px)
  border: number; // white margin between perforation and photo (px)
};

export type LabelConfig = {
  enabled: boolean;
  format: LabelFormat;
};

/** A user text layer baked onto the photo (M5). */
export type TextLayer = {
  id: string;
  content: string;
  fontKey: string; // key into the FONTS registry
  color: string;
  sizePct: number; // font size as a fraction of photo height (0..1)
  x: number; // normalized center 0..1 within the photo
  y: number;
  rotation: number; // degrees
  align: TextAlign;
};

export type StampDesign = {
  version: 1;
  /** Id of the film preset last applied, or null when hand-tuned. */
  presetId: string | null;
  film: RetroFadeParams;
  crop: CropTransform;
  frame: FrameConfig;
  label: LabelConfig;
  texts: TextLayer[];
};
