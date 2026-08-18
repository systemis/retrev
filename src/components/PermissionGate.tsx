import { Feather } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "@/src/theme";

type Props = {
  /** True once we've asked and been denied (vs. not-yet-asked). */
  denied: boolean;
  onRequest: () => void;
};

/**
 * Camera permission empty-state (dev-plan §5.2, §12). Offers "Allow access"
 * before the OS-denied wall, then falls back to "Open Settings".
 */
export function PermissionGate({ denied, onRequest }: Props) {
  return (
    <View style={styles.container}>
      <Feather name="camera-off" size={40} color={colors.textSecondary} />
      <Text style={[type.title, styles.title]}>Camera access needed</Text>
      <Text style={[type.body, styles.body]}>
        Faded needs your camera to capture a frame. Nothing leaves your device.
      </Text>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        ]}
        onPress={denied ? () => Linking.openSettings() : onRequest}
      >
        <Text style={styles.buttonText}>
          {denied ? "Open Settings" : "Allow access"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  title: {
    marginTop: spacing.sm,
  },
  body: {
    textAlign: "center",
    color: colors.textSecondary,
  },
  button: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  buttonText: {
    ...type.body,
    color: "#FFFFFF",
    fontFamily: type.title.fontFamily,
  },
});
