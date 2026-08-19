import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "@/src/theme";

type Props = {
  onReset: () => void;
};

/** Crop tab: gestures live on the preview; this panel explains + resets them. */
export function CropPanel({ onReset }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[type.body, styles.hint]}>
        Pinch to zoom · drag to reposition
      </Text>
      <Pressable
        onPress={onReset}
        style={({ pressed }) => [
          styles.reset,
          { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
        ]}
      >
        <Text style={styles.resetText}>Reset</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  hint: {
    color: colors.textSecondary,
  },
  reset: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    ...type.body,
    fontFamily: type.title.fontFamily,
    color: colors.textPrimary,
  },
});
