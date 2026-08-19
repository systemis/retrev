import {
  Group,
  Rect,
  Skia,
  type SkTypeface,
  Text as SkiaText,
} from "@shopify/react-native-skia";
import type { InnerRect } from "@/src/components/stampPath";
import type { TextLayer } from "@/src/design/types";
import { type FontKey, isFontKey } from "@/src/text/fonts";
import { colors } from "@/src/theme";

type Props = {
  rect: InnerRect;
  layers: TextLayer[];
  typefaces: Partial<Record<FontKey, SkTypeface>>;
  selectedId: string | null;
};

/** Live text overlay for the editor preview (matches renderStamp's baking math). */
export function TextLayers({ rect, layers, typefaces, selectedId }: Props) {
  return (
    <Group>
      {layers.map((t) => {
        if (!isFontKey(t.fontKey)) return null;
        const tf = typefaces[t.fontKey];
        if (!tf) return null;

        const sizePx = Math.max(1, t.sizePct * rect.height);
        const font = Skia.Font(tf, sizePx);
        const width = font.measureText(t.content || " ").width;
        const alignOffset =
          t.align === "center" ? width / 2 : t.align === "right" ? width : 0;
        const cx = rect.x + t.x * rect.width;
        const cy = rect.y + t.y * rect.height;
        const drawX = cx - alignOffset;
        const drawY = cy + sizePx * 0.35;

        return (
          <Group
            key={t.id}
            origin={{ x: cx, y: cy }}
            transform={[{ rotate: (t.rotation * Math.PI) / 180 }]}
          >
            {selectedId === t.id ? (
              <Rect
                x={drawX - 4}
                y={cy - sizePx / 2 - 2}
                width={width + 8}
                height={sizePx + 4}
                color={colors.accent}
                style="stroke"
                strokeWidth={1}
              />
            ) : null}
            <SkiaText x={drawX} y={drawY} text={t.content} font={font} color={t.color} />
          </Group>
        );
      })}
    </Group>
  );
}
