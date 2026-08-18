import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Blur, Canvas, Image as SkiaImage, useImage } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, shadows, softSpring, spacing, type, useReduceMotion } from "@/src/theme";
import { PerforatedEdge } from "./PerforatedEdge";

type Props = {
  uri: string;
  /** Paper width; the photo sizes to (width - 12) at 3:4. */
  width: number;
  dateLabel: string;
};

/**
 * Result-screen reveal (dev-plan §9.4): the saved image emerges from a blurred,
 * washed "undeveloped" state to its full faded look, then the stamp frame +
 * perforation scale in.
 */
export function DevelopReveal({ uri, width, dateLabel }: Props) {
  const reduceMotion = useReduceMotion();
  const image = useImage(uri);

  const photoW = width - 12;
  const photoH = photoW * (4 / 3);

  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const frame = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      reveal.value = 1;
      frame.value = 1;
      return;
    }
    reveal.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    frame.value = withDelay(650, withSpring(1, softSpring));
  }, [reduceMotion, reveal, frame]);

  const blur = useDerivedValue(() => 16 * (1 - reveal.value));
  const veilStyle = useAnimatedStyle(() => ({ opacity: 0.8 * (1 - reveal.value) }));
  const frameStyle = useAnimatedStyle(() => ({
    opacity: frame.value,
    transform: [{ scale: 0.9 + 0.1 * frame.value }],
  }));

  return (
    <Animated.View style={[styles.paper, shadows.stamp, { width }, frameStyle]}>
      <View style={[styles.photoWrap, { width: photoW, height: photoH }]}>
        <Canvas style={{ width: photoW, height: photoH }}>
          {image ? (
            <SkiaImage
              image={image}
              x={0}
              y={0}
              width={photoW}
              height={photoH}
              fit="cover"
            >
              <Blur blur={blur} />
            </SkiaImage>
          ) : null}
        </Canvas>
        {/* Warm "undeveloped" veil that clears as the image resolves. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.veil, veilStyle]}
        />
      </View>
      <Text style={[type.monoStamp, styles.label]}>{dateLabel}</Text>
      <PerforatedEdge width={width - 8} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.stampPaper,
    borderRadius: radius.card,
    padding: 6,
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  photoWrap: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  veil: {
    backgroundColor: "#EDE4D2",
  },
  label: {
    textAlign: "center",
    paddingTop: spacing.sm,
  },
});
