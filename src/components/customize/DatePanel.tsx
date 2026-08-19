import { StyleSheet, Switch, Text, View } from "react-native";
import type { LabelConfig, LabelFormat } from "@/src/design/types";
import { colors, spacing, type } from "@/src/theme";
import { SegmentedControl } from "./SegmentedControl";

type Props = {
  label: LabelConfig;
  onChange: (patch: Partial<LabelConfig>) => void;
};

const FORMAT_OPTIONS: { value: LabelFormat; label: string }[] = [
  { value: "dotted", label: "'26 08 18" },
  { value: "slash", label: "26/08/18" },
];

/** Date-stamp controls: show/hide + format. */
export function DatePanel({ label, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={type.body}>Show date stamp</Text>
        <Switch
          value={label.enabled}
          onValueChange={(enabled) => onChange({ enabled })}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor="#FFFFFF"
        />
      </View>
      <SegmentedControl<LabelFormat>
        options={FORMAT_OPTIONS}
        value={label.format}
        onChange={(format) => onChange({ format })}
        disabled={!label.enabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
