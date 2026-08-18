import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { layout, spacing, type } from "@/src/theme";

type Props = {
  title: string;
  /** Right-aligned slot — e.g. a photo count or action. */
  right?: ReactNode;
};

export function ScreenHeader({ title, right }: Props) {
  return (
    <View style={styles.row}>
      <Text style={type.display}>{title}</Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  right: {
    paddingBottom: spacing.xs,
  },
});
