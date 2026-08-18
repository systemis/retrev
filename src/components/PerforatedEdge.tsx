import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";

type Props = {
  /** Inner width of the stamp paper the notches are punched into. */
  width: number;
  notchRadius?: number;
  /** Notch fill — the page background, so notches read as bite-marks. */
  color?: string;
};

/**
 * The stamp "rãnh": a row of page-colored semicircles punched into the bottom
 * edge, half-clipped below the card so they read as perforations (dev-plan §6.1,
 * primary overlay technique).
 */
export function PerforatedEdge({
  width,
  notchRadius = 5,
  color = colors.bg,
}: Props) {
  const d = notchRadius * 2;
  // Evenly space notches with a ~1px gap; center-align the row.
  const count = Math.max(3, Math.floor(width / (d + 2)));
  const notches = Array.from({ length: count });

  return (
    <View
      pointerEvents="none"
      style={[styles.row, { height: d, bottom: -notchRadius }]}
    >
      {notches.map((_, i) => (
        <View
          key={i}
          style={{
            width: d,
            height: d,
            borderRadius: notchRadius,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: 4,
    right: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
