/**
 * Faded — color tokens (dev-plan §4.1).
 * Primary theme is LIGHT: a warm cream "album page" on which near-white stamps
 * sit, lifted by soft warm shadows. Depth comes from shadow, not surface lightening.
 * No component should hard-code a color — always read from here.
 */
export const colors = {
  /** App background — clean white. */
  bg: "#FFFFFF",
  /** Cards, sheets — near-white, faintly warm. */
  surface: "#FFFDF8",
  /** Pressed/hover state on surfaces. */
  surfacePressed: "#EFE8DA",
  /** Warm hairline separators, stamp inner edge. */
  border: "#E4DCCB",
  /** Warm near-black. */
  textPrimary: "#221E17",
  /** Meta, timestamps — warm gray. */
  textSecondary: "#8A8172",
  /** Burnt-sienna / terracotta — shutter ring, highlights. */
  accent: "#C56A3D",
  /** Accent pressed. */
  accentPressed: "#A8552E",
  /** Stamp border/paper — pure white so stamps pop against the cream page. */
  stampPaper: "#FFFFFF",
  /** Warm soft shadow color for stamp/FAB elevation (stronger, to read on white). */
  shadow: "rgba(60, 44, 24, 0.22)",
  /** Solid shadow color (RN shadow props take an opaque color + separate opacity). */
  shadowSolid: "#3C2C18",
} as const;

export type ColorToken = keyof typeof colors;
