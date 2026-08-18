import { memo, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  colors,
  radius,
  shadows,
  softSpring,
  spacing,
  spring,
  type,
} from "@/src/theme";
import { PerforatedEdge } from "./PerforatedEdge";

type Props = {
  uri: string;
  dateLabel: string;
  /** Column width from the grid; the paper sizes to this. */
  width: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** One-time "drop + settle" for a freshly captured stamp (dev-plan §9.1). */
  dropIn?: boolean;
  reduceMotion?: boolean;
};

/**
 * The signature UI element: a filtered photo styled as a postage stamp with a
 * perforated bottom edge, a mono date label and a soft warm shadow (dev-plan §6.1).
 * Memoized so FlashList recycling stays cheap at 100+ items.
 */
function StampCardImpl({
  uri,
  dateLabel,
  width,
  onPress,
  onLongPress,
  dropIn = false,
  reduceMotion = false,
}: Props) {
  const press = useSharedValue(1);
  const animateDrop = dropIn && !reduceMotion;
  const drop = useSharedValue(animateDrop ? 0 : 1);

  useEffect(() => {
    drop.value = animateDrop ? withSpring(1, softSpring) : 1;
  }, [animateDrop, drop]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [
      { translateY: (1 - drop.value) * -24 },
      { scale: press.value * (0.96 + 0.04 * drop.value) },
    ],
  }));

  return (
    <Animated.View style={[{ width }, animatedStyle]}>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={`Photo from ${dateLabel}`}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={320}
        onPressIn={() => {
          press.value = withSpring(0.97, spring);
        }}
        onPressOut={() => {
          press.value = withSpring(1, spring);
        }}
      >
        <View style={[styles.paper, shadows.stamp]}>
          <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
          <Text style={[type.monoStamp, styles.label]}>{dateLabel}</Text>
          <PerforatedEdge width={width - 8} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const StampCard = memo(StampCardImpl);

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.stampPaper,
    borderRadius: radius.card,
    padding: 6,
    paddingBottom: spacing.xs,
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
});
