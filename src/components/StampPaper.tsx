import {
  Canvas,
  Group,
  Path,
  RoundedRect,
  Shadow,
  Skia,
} from "@shopify/react-native-skia";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { colors } from "@/src/theme";
import {
  type InnerRect,
  makeStampPath,
  STAMP_PAD,
  STAMP_TOOTH,
  stampInnerRect,
} from "./stampPath";

type Props = {
  width: number;
  height: number;
  /** Extra white space reserved at the bottom for a date label. */
  labelReserve?: number;
  /** Draw a hairline border around the photo. */
  bordered?: boolean;
  /** Skia content for the photo area; clipped to the inner rounded rect. */
  children: (rect: InnerRect) => ReactNode;
};

/**
 * A realistic postage stamp: white paper with all-four-side perforations and a
 * soft drop shadow (so the scalloped silhouette reads even on a white page),
 * with the caller's photo/Skia content clipped inside. Shared by StampCard,
 * DevelopReveal, DevelopingAnimation and EmptyLibrary for one visual language.
 */
export function StampPaper({
  width,
  height,
  labelReserve = 16,
  bordered = true,
  children,
}: Props) {
  const stampW = width - 2 * STAMP_PAD;
  const stampH = height - 2 * STAMP_PAD;

  const path = useMemo(
    () => makeStampPath(stampW, stampH, STAMP_TOOTH),
    [stampW, stampH],
  );
  const inner = useMemo(
    () => stampInnerRect(width, height, labelReserve),
    [width, height, labelReserve],
  );
  const clip = useMemo(
    () =>
      Skia.RRectXY(
        Skia.XYWHRect(inner.x, inner.y, inner.width, inner.height),
        3,
        3,
      ),
    [inner],
  );

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ translateX: STAMP_PAD }, { translateY: STAMP_PAD }]}>
        <Path path={path} color={colors.stampPaper}>
          <Shadow dx={0} dy={4} blur={8} color={colors.shadow} />
        </Path>
      </Group>
      <Group clip={clip}>{children(inner)}</Group>
      {bordered ? (
        <RoundedRect
          x={inner.x}
          y={inner.y}
          width={inner.width}
          height={inner.height}
          r={3}
          color={colors.border}
          style="stroke"
          strokeWidth={1}
        />
      ) : null}
    </Canvas>
  );
}
