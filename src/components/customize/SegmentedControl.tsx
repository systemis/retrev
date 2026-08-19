import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "@/src/theme";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: Props<T>) {
  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            disabled={disabled}
            onPress={() => onChange(o.value)}
            style={[styles.seg, active && styles.segActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[type.caption, active && styles.textActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.surfacePressed,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  disabled: {
    opacity: 0.45,
  },
  seg: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  segActive: {
    backgroundColor: colors.surface,
  },
  textActive: {
    color: colors.accent,
    fontFamily: type.title.fontFamily,
  },
});
