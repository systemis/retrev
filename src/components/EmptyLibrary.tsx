import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, shadows, spacing, type, useReduceMotion } from "@/src/theme";
import { PerforatedEdge } from "./PerforatedEdge";

const CARD_W = 120;

/** Empty-state for the library — a lone floating stamp + invitation (dev-plan §5.1). */
export function EmptyLibrary() {
  const reduceMotion = useReduceMotion();
  const float = useSharedValue(0);

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
      <Animated.View style={[styles.card, shadows.stamp, floatStyle]}>
        <View style={styles.photo} />
        <Text style={[type.monoStamp, styles.label]}>' — — —</Text>
        <PerforatedEdge width={CARD_W - 8} />
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
  card: {
    width: CARD_W,
    backgroundColor: colors.stampPaper,
    borderRadius: radius.card,
    padding: 6,
    marginBottom: spacing.lg,
  },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 8,
    backgroundColor: colors.surfacePressed,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    textAlign: "center",
    paddingVertical: spacing.xs,
  },
  title: {
    marginTop: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
