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
import type { FrameConfig } from "@/src/design/types";
import { colors, softSpring, type, useReduceMotion } from "@/src/theme";
import { StampPaper } from "./StampPaper";
import { stampCanvasHeight, STAMP_PAD, STAMP_TOOTH } from "./stampPath";

type Props = {
  uri: string;
  /** Stamp (canvas) width. */
  width: number;
  dateLabel: string;
  frame?: FrameConfig;
  showLabel?: boolean;
};

/**
 * Result-screen reveal (dev-plan §9.4): the saved image emerges from a blurred,
 * washed "undeveloped" state to its full look, then the perforated stamp frame
 * scales in.
 */
export function DevelopReveal({
  uri,
  width,
  dateLabel,
  frame,
  showLabel = true,
}: Props) {
  const reduceMotion = useReduceMotion();
  const image = useImage(uri);
  const height = stampCanvasHeight(width);

  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const frameIn = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      reveal.value = 1;
      frameIn.value = 1;
      return;
    }
    reveal.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    frameIn.value = withDelay(500, withSpring(1, softSpring));
  }, [reduceMotion, reveal, frameIn]);

  const blur = useDerivedValue(() => 16 * (1 - reveal.value));
  const veilOpacity = useDerivedValue(() => 0.8 * (1 - reveal.value));
  const frameStyle = useAnimatedStyle(() => ({
    opacity: frameIn.value,
    transform: [{ scale: 0.9 + 0.1 * frameIn.value }],
  }));

  return (
    <Animated.View style={[{ width, height }, frameStyle]}>
      <StampPaper width={width} height={height} frame={frame}>
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
      {showLabel ? (
        <Text style={[type.monoStamp, styles.label]}>{dateLabel}</Text>
      ) : null}
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
