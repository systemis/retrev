import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { FILM_PRESETS } from "@/src/design/presets";
import { colors, radius, spacing, type } from "@/src/theme";

type Props = {
  activeId: string | null;
  onSelect: (id: string) => void;
};

/** Horizontal strip of one-tap film-look presets. */
export function PresetStrip({ activeId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILM_PRESETS.map((p) => {
        const active = p.id === activeId;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[type.caption, active && styles.textActive]}>
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  textActive: {
    color: "#FFFFFF",
  },
});
