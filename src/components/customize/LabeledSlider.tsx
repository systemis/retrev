import Slider from "@react-native-community/slider";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "@/src/theme";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

export function LabeledSlider({ label, value, min, max, step, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={type.caption}>{label}</Text>
        <Text style={[type.caption, styles.value]}>{value.toFixed(2)}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  value: {
    color: colors.textSecondary,
    fontFamily: type.monoStamp.fontFamily,
  },
});
