import {
  Fill,
  Group,
  type SkTypeface,
  useImage,
} from "@shopify/react-native-skia";
import { StyleSheet, Text, View } from "react-native";
import { StampPaper } from "@/src/components/StampPaper";
import { stampCanvasHeight, STAMP_PAD, STAMP_TOOTH } from "@/src/components/stampPath";
import type { StampDesign } from "@/src/design/types";
import type { FontKey } from "@/src/text/fonts";
import { colors, type } from "@/src/theme";
import { FilmImage } from "./FilmImage";
import { TextLayers } from "./TextLayers";

type Props = {
  sourceUri: string;
  design: StampDesign;
  width: number;
  dateLabel: string;
  typefaces: Partial<Record<FontKey, SkTypeface>>;
  selectedTextId?: string | null;
};

/** Live stamp preview for the editor: original photo, graded + cropped + text. */
export function CustomizePreview({
  sourceUri,
  design,
  width,
  dateLabel,
  typefaces,
  selectedTextId,
}: Props) {
  const image = useImage(sourceUri);
  const height = stampCanvasHeight(width);

  return (
    <View style={{ width, height }}>
      <StampPaper width={width} height={height} frame={design.frame}>
        {(rect) => (
          <Group>
            {image ? (
              <FilmImage
                image={image}
                rect={rect}
                film={design.film}
                crop={design.crop}
              />
            ) : (
              <Fill color={colors.surfacePressed} />
            )}
            <TextLayers
              rect={rect}
              layers={design.texts}
              typefaces={typefaces}
              selectedId={selectedTextId ?? null}
            />
          </Group>
        )}
      </StampPaper>
      {design.label.enabled ? (
        <Text style={[type.monoStamp, styles.label]}>{dateLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: STAMP_PAD + STAMP_TOOTH + 2,
    textAlign: "center",
  },
});
