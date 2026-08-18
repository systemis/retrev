import { Circle, Fill, Group } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, spacing, type, useReduceMotion } from "@/src/theme";
import { StampPaper } from "./StampPaper";
import { stampCanvasHeight } from "./stampPath";

const CARD_W = 132;

/** Empty-state for the library — a lone floating stamp + invitation (dev-plan §5.1). */
export function EmptyLibrary() {
  const reduceMotion = useReduceMotion();
  const float = useSharedValue(0);
  const height = stampCanvasHeight(CARD_W);

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 * float.value },
      { rotate: `${-2 + float.value * 4}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[{ width: CARD_W, height }, floatStyle]}>
        <StampPaper width={CARD_W} height={height}>
          {(rect) => (
            <Group>
              <Fill color={colors.surfacePressed} />
              <Circle
                cx={rect.x + rect.width / 2}
                cy={rect.y + rect.height * 0.42}
                r={rect.width * 0.16}
                color={colors.border}
              />
            </Group>
          )}
        </StampPaper>
      </Animated.View>
      <Text style={[type.title, styles.title]}>No shots yet</Text>
      <Text style={[type.body, styles.body]}>
        Tap the shutter to capture your first frame.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 120,
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.lg,
  },
  body: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
