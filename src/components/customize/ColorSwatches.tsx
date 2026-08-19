import { Pressable, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/src/theme";

const SWATCHES = [
  "#FFFFFF",
  "#221E17",
  "#C56A3D",
  "#E8C34A",
  "#4E8F5A",
  "#3D6DC5",
  "#C53D6D",
];

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorSwatches({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {SWATCHES.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={`Color ${c}`}
          style={[
            styles.swatch,
            { backgroundColor: c },
            value === c && styles.active,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    borderWidth: 3,
    borderColor: colors.accent,
  },
});
