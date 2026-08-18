import { Fill, Path, Shader, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, type, useReduceMotion } from "@/src/theme";
import { StampPaper } from "./StampPaper";
import { stampCanvasHeight, stampInnerRect, STAMP_PAD, STAMP_TOOTH } from "./stampPath";

/** Soft warm grain that resolves into a faint image as `reveal` → 1 (dev-plan §9.3). */
const grain = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;
uniform float reveal;

float hash(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

half4 main(float2 xy) {
  float2 uv = xy / resolution;
  float3 base = mix(float3(0.85, 0.79, 0.68), float3(0.97, 0.92, 0.80), uv.y);
  float g = hash(uv * resolution + time * 120.0);
  float grainAmt = (1.0 - reveal) * 0.85;
  float3 col = base + (g - 0.5) * grainAmt;
  float wash = mix(0.35, 1.0, reveal);
  col = mix(float3(0.93, 0.90, 0.83), col, wash);
  return half4(half3(clamp(col, 0.0, 1.0)), 1.0);
}
`)!;

/**
 * The Processing-screen loader: a photo surfacing on stamp paper, a sweeping
 * accent progress arc, and a cycling DEVELOPING… label, gently pulsing (§9.3).
 */
export function DevelopingAnimation() {
  const reduceMotion = useReduceMotion();
  const { width: screenW } = useWindowDimensions();

  const paperW = Math.min(240, screenW * 0.62);
  const height = stampCanvasHeight(paperW);
  const inner = useMemo(
    () => stampInnerRect(paperW, height),
    [paperW, height],
  );

  const time = useSharedValue(0);
  const reveal = useSharedValue(reduceMotion ? 0.7 : 0);
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    time.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );
    reveal.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
    sweep.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, time, reveal, sweep, pulse]);

  const uniforms = useDerivedValue(() => ({
    resolution: [paperW, height],
    time: time.value,
    reveal: reveal.value,
  }));

  const arcPath = useMemo(() => {
    const p = Skia.Path.Make();
    const cx = inner.x + inner.width / 2;
    const cy = inner.y + inner.height / 2;
    const r = Math.min(inner.width, inner.height) * 0.26;
    p.addCircle(cx, cy, r);
    return p;
  }, [inner]);

  const arcEnd = useDerivedValue(() => sweep.value);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.98 + 0.02 * pulse.value }],
  }));
  const label = useCyclingLabel(reduceMotion);

  return (
    <View style={styles.container}>
      <Animated.View style={[{ width: paperW, height }, pulseStyle]}>
        <StampPaper width={paperW} height={height}>
          {() => (
            <>
              <Fill>
                <Shader source={grain} uniforms={uniforms} />
              </Fill>
              <Path
                path={arcPath}
                start={0}
                end={arcEnd}
                style="stroke"
                strokeWidth={4}
                strokeCap="round"
                color={colors.accent}
              />
            </>
          )}
        </StampPaper>
        <Text style={[type.monoStamp, styles.label]}>{label}</Text>
      </Animated.View>
    </View>
  );
}

/** Cycles DEVELOPING → DEVELOPING. → .. → … for the mono label. */
function useCyclingLabel(reduceMotion: boolean): string {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, [reduceMotion]);
  return `DEVELOPING${".".repeat(dots)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: STAMP_PAD + STAMP_TOOTH,
    textAlign: "center",
    letterSpacing: 2,
  },
});
