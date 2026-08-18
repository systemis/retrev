import { Fill, Image as SkiaImage, useImage } from "@shopify/react-native-skia";
import { memo, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, softSpring, spring, type } from "@/src/theme";
import { StampPaper } from "./StampPaper";
import { stampCanvasHeight, STAMP_PAD, STAMP_TOOTH } from "./stampPath";

type Props = {
  uri: string;
  dateLabel: string;
  /** Column width from the grid; the stamp (incl. shadow pad) sizes to this. */
  width: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** One-time "drop + settle" for a freshly captured stamp (dev-plan §9.1). */
  dropIn?: boolean;
  reduceMotion?: boolean;
};

/**
 * The signature UI element: a filtered photo rendered as a realistic postage
 * stamp — white paper, perforated on all four edges, soft warm shadow, mono
 * date label (dev-plan §6.1). Memoized so FlashList recycling stays cheap.
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
  const image = useImage(uri);
  const height = stampCanvasHeight(width);

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
        <View style={{ width, height }}>
          <StampPaper width={width} height={height}>
            {(rect) =>
              image ? (
                <SkiaImage
                  image={image}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fit="cover"
                />
              ) : (
                <Fill color={colors.surfacePressed} />
              )
            }
          </StampPaper>
          <Text style={[type.monoStamp, styles.label]}>{dateLabel}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const StampCard = memo(StampCardImpl);

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: STAMP_PAD + STAMP_TOOTH + 2,
    textAlign: "center",
  },
});
