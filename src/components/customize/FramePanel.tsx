import { StyleSheet, Text, View } from "react-native";
import {
  BORDER_RANGE,
  PAPER_OPTIONS,
  TOOTH_RANGE,
} from "@/src/design/frame";
import type { FrameConfig, PaperTint } from "@/src/design/types";
import { spacing, type } from "@/src/theme";
import { LabeledSlider } from "./LabeledSlider";
import { SegmentedControl } from "./SegmentedControl";

type Props = {
  frame: FrameConfig;
  onChange: (patch: Partial<FrameConfig>) => void;
};

/** Stamp paper controls: tint, perforation size, border width. */
export function FramePanel({ frame, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[type.caption, styles.heading]}>Paper</Text>
      <View style={styles.segRow}>
        <SegmentedControl<PaperTint>
          options={PAPER_OPTIONS}
          value={frame.paper}
          onChange={(paper) => onChange({ paper })}
        />
      </View>
      <LabeledSlider
        label="Perforation"
        value={frame.tooth}
        min={TOOTH_RANGE.min}
        max={TOOTH_RANGE.max}
        step={TOOTH_RANGE.step}
        onChange={(tooth) => onChange({ tooth })}
      />
      <LabeledSlider
        label="Border"
        value={frame.border}
        min={BORDER_RANGE.min}
        max={BORDER_RANGE.max}
        step={BORDER_RANGE.step}
        onChange={(border) => onChange({ border })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  heading: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  segRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
