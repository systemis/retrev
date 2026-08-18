import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, layout, shadows, spring, useReduceMotion } from "@/src/theme";

type Props = {
  onPress?: () => void;
  size?: number;
  /** `home` = accent ring on cream; `camera` = white ring on the viewfinder. */
  variant?: "home" | "camera";
  disabled?: boolean;
};

/**
 * The shutter — accent ring + inner disc with a breathing idle loop and a
 * press ripple (dev-plan §6.2, §9.2). Shared between the Home FAB and Camera
 * for visual continuity.
 */
export function ShutterButton({
  onPress,
  size = layout.fabSize,
  variant = "home",
  disabled = false,
}: Props) {
  const reduceMotion = useReduceMotion();
  const breathe = useSharedValue(0);
  const disc = useSharedValue(1);
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    breathe.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, breathe]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.03 * breathe.value }],
  }));
  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: disc.value }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ripple.value),
    transform: [{ scale: 1 + 0.4 * ripple.value }],
  }));

  const isHome = variant === "home";
  const ringColor = isHome ? colors.accent : "#FFFFFF";
  const discColor = isHome ? colors.accent : "#FFFFFF";
  const discSize = size * 0.62;

  const onPressIn = () => {
    disc.value = withSpring(0.85, spring);
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.ease) });
  };
  const onPressOut = () => {
    disc.value = withSpring(1, spring);
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Capture photo"
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.ring,
          isHome && shadows.fab,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
            backgroundColor: isHome ? colors.surface : "transparent",
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rippleRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: ringColor,
            },
            rippleStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: discSize,
              height: discSize,
              borderRadius: discSize / 2,
              backgroundColor: discColor,
            },
            discStyle,
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
  rippleRing: {
    position: "absolute",
    borderWidth: 3,
  },
});
