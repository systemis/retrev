import type { PaperTint } from "./types";

/** Paper tint → fill color for the stamp paper. */
export const PAPER_COLORS: Record<PaperTint, string> = {
  white: "#FFFFFF",
  cream: "#F5ECD9",
  kraft: "#D8C3A0",
};

export const PAPER_OPTIONS: { value: PaperTint; label: string }[] = [
  { value: "white", label: "White" },
  { value: "cream", label: "Cream" },
  { value: "kraft", label: "Kraft" },
];

export const TOOTH_RANGE = { min: 3, max: 7, step: 0.5 };
export const BORDER_RANGE = { min: 3, max: 16, step: 1 };
