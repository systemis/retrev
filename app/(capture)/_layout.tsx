import { Stack } from "expo-router";
import { colors } from "@/src/theme";

/**
 * The capture flow — a stack presented modally over the library (dev-plan §5).
 * camera → processing → result, navigated with `router.replace` so Back never
 * lands on a stale intermediate step.
 */
export default function CaptureLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="camera" />
      <Stack.Screen name="processing" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
