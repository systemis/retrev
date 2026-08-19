import {
  Canvas,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { FONT_KEYS, FONTS, type FontKey } from "@/src/text/fonts";
import { colors, radius, spacing, type } from "@/src/theme";

type Props = {
  value: FontKey;
  onChange: (key: FontKey) => void;
};

export function FontPicker({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FONT_KEYS.map((key) => (
        <FontChip
          key={key}
          fontKey={key}
          active={key === value}
          onPress={() => onChange(key)}
        />
      ))}
    </ScrollView>
  );
}

function FontChip({
  fontKey,
  active,
  onPress,
}: {
  fontKey: FontKey;
  active: boolean;
  onPress: () => void;
}) {
  const entry = FONTS[fontKey];
  const font = useFont(entry.module, 22);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Canvas style={styles.sample}>
        {font ? (
          <SkiaText
            x={2}
            y={22}
            text={entry.sample}
            font={font}
            color={active ? colors.accent : colors.textPrimary}
          />
        ) : null}
      </Canvas>
      <Text style={[type.caption, active && styles.labelActive]}>
        {entry.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 56,
  },
  chipActive: {
    borderColor: colors.accent,
  },
  sample: {
    width: 44,
    height: 28,
  },
  labelActive: {
    color: colors.accent,
  },
});
