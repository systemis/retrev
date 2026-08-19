import { Skia, type SkPath } from "@shopify/react-native-skia";

/**
 * Realistic postage-stamp geometry: a rounded scalloped rectangle with
 * semicircular perforation teeth on all four edges (dev-plan §6.1, crisp Skia
 * variant). Built with `arcToOval` using explicit start/sweep angles so the
 * tooth direction is unambiguous (no SVG arc-flag guesswork).
 */

/** Breathing room inside the canvas so the drop shadow isn't clipped. */
export const STAMP_PAD = 12;
/** Perforation tooth radius. */
export const STAMP_TOOTH = 4;
/** White paper margin between the perforation and the photo. */
export const STAMP_BORDER = 7;
/** Portrait aspect (height / width) of the paper body. */
export const STAMP_ASPECT = 1.3;

export type InnerRect = { x: number; y: number; width: number; height: number };

/** Canvas height for a given canvas width, including shadow padding. */
export function stampCanvasHeight(width: number, aspect = STAMP_ASPECT): number {
  const stampW = width - 2 * STAMP_PAD;
  const stampH = stampW * aspect;
  return stampH + 2 * STAMP_PAD;
}

/** Photo rect inside the paper (canvas coords), reserving a bottom label band. */
export function stampInnerRect(
  width: number,
  height: number,
  labelReserve = 16,
  tooth = STAMP_TOOTH,
  border = STAMP_BORDER,
): InnerRect {
  const stampW = width - 2 * STAMP_PAD;
  const stampH = height - 2 * STAMP_PAD;
  const inset = tooth + border;
  return {
    x: STAMP_PAD + inset,
    y: STAMP_PAD + inset,
    width: stampW - 2 * inset,
    height: stampH - 2 * inset - labelReserve,
  };
}

/**
 * Build the scalloped stamp outline for a paper of size `w`×`h`, tooth radius
 * `r`. Coordinates run 0..w / 0..h (tooth tips touch those bounds); translate
 * the drawing by STAMP_PAD to leave shadow room in the canvas.
 */
export function makeStampPath(w: number, h: number, r: number): SkPath {
  const p = Skia.Path.Make();
  const left = r;
  const top = r;
  const right = w - r;
  const bottom = h - r;
  const innerW = right - left;
  const innerH = bottom - top;
  const nx = Math.max(4, Math.round(innerW / (2 * r)));
  const ny = Math.max(4, Math.round(innerH / (2 * r)));
  const dx = innerW / nx;
  const dy = innerH / ny;

  p.moveTo(left, top);
  // Top edge: left → right, teeth bulge up. (0° = +x/east, 90° = +y/south.)
  for (let i = 0; i < nx; i++) {
    const x = left + i * dx;
    p.arcToOval(Skia.XYWHRect(x, top - r, dx, 2 * r), 180, 180, false);
  }
  // Right edge: top → bottom, teeth bulge right.
  for (let i = 0; i < ny; i++) {
    const y = top + i * dy;
    p.arcToOval(Skia.XYWHRect(right - r, y, 2 * r, dy), 270, 180, false);
  }
  // Bottom edge: right → left, teeth bulge down.
  for (let i = 0; i < nx; i++) {
    const x = right - i * dx;
    p.arcToOval(Skia.XYWHRect(x - dx, bottom - r, dx, 2 * r), 0, 180, false);
  }
  // Left edge: bottom → top, teeth bulge left.
  for (let i = 0; i < ny; i++) {
    const y = bottom - i * dy;
    p.arcToOval(Skia.XYWHRect(left - r, y - dy, 2 * r, dy), 90, 180, false);
  }
  p.close();
  return p;
}
