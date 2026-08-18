import { forwardRef, useImperativeHandle } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type ShutterFlashHandle = {
  /** Fire a quick white flash (~180ms total). */
  flash: () => void;
};

/**
 * Full-screen white overlay that flashes opacity 0 → 0.9 → 0 on capture
 * (dev-plan §6.3). Drive it imperatively via a ref so the camera can trigger it
 * exactly at the shutter moment.
 */
export const ShutterFlash = forwardRef<ShutterFlashHandle>(
  function ShutterFlash(_props, ref) {
    const opacity = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      flash: () => {
        opacity.value = withSequence(
          withTiming(0.9, { duration: 70 }),
          withTiming(0, { duration: 120 }),
        );
      },
    }));

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.flash, style]}
      />
    );
  },
);

const styles = StyleSheet.create({
  flash: {
    backgroundColor: "#FFFFFF",
    zIndex: 50,
  },
});
