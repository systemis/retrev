import {
  Blur,
  Fill,
  Group,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, softSpring, type, useReduceMotion } from "@/src/theme";
import { StampPaper } from "./StampPaper";
import { stampCanvasHeight, STAMP_PAD, STAMP_TOOTH } from "./stampPath";

type Props = {
  uri: string;
  /** Stamp (canvas) width. */
  width: number;
  dateLabel: string;
};

/**
 * Result-screen reveal (dev-plan §9.4): the saved image emerges from a blurred,
 * washed "undeveloped" state to its full faded look, then the perforated stamp
 * frame scales in.
 */
export function DevelopReveal({ uri, width, dateLabel }: Props) {
  const reduceMotion = useReduceMotion();
  const image = useImage(uri);
  const height = stampCanvasHeight(width);

  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const frame = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      reveal.value = 1;
      frame.value = 1;
      return;
    }
    reveal.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    frame.value = withDelay(500, withSpring(1, softSpring));
  }, [reduceMotion, reveal, frame]);

  const blur = useDerivedValue(() => 16 * (1 - reveal.value));
  const veilOpacity = useDerivedValue(() => 0.8 * (1 - reveal.value));
  const frameStyle = useAnimatedStyle(() => ({
    opacity: frame.value,
    transform: [{ scale: 0.9 + 0.1 * frame.value }],
  }));

  return (
    <Animated.View style={[{ width, height }, frameStyle]}>
      <StampPaper width={width} height={height}>
        {(rect) => (
          <Group>
            {image ? (
              <SkiaImage
                image={image}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fit="cover"
              >
                <Blur blur={blur} />
              </SkiaImage>
            ) : (
              <Fill color={colors.surfacePressed} />
            )}
            <Group opacity={veilOpacity}>
              <Fill color="#EDE4D2" />
            </Group>
          </Group>
        )}
      </StampPaper>
      <Text style={[type.monoStamp, styles.label]}>{dateLabel}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: STAMP_PAD + STAMP_TOOTH + 2,
    textAlign: "center",
  },
});
