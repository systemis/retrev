---
name: seamless-blur-header
description: >-
  Build a frosted/translucent blur header (iOS-style large-title or sticky nav
  bar) for a React Native / Expo screen that blends SEAMLESSLY into a scrolling
  list — no visible seam, divider line, or hard edge between the header and the
  content beneath it. Use whenever the user asks for a blur/frosted/translucent
  header, a nav bar that blurs content on scroll, or complains that the header
  looks separated / has a clear boundary from the main screen. Stack:
  expo-blur + expo-linear-gradient + @react-native-masked-view/masked-view +
  react-native-reanimated.
---

# Seamless blur header

A frosted header that dissolves into the scrolling content instead of sitting as
a distinct bar. The trick: **gradient-mask the blur so its alpha fades to 0 at
the bottom**, and remove every hard edge.

## Why a blur header usually shows a seam

Three things make a frosted header look like a separate section. Eliminate all three:

1. **A hairline / bottom border** on the header → don't add one.
2. **An opaque fill with a hard bottom edge** (e.g. `rgba(255,255,255,0.7)`
   ending abruptly) → make it fade out instead.
3. **The blur's own hard bottom cutoff** — the blurred region stops abruptly at
   `headerHeight`, drawing a visible line → **mask it with a vertical gradient**
   so the blur (and the fill) fade to transparent before that edge.

The fix for #3 (and #2) is a `MaskedView` whose mask is a `LinearGradient` going
opaque→transparent, wrapping the blur + wash. The header's title/actions render
*on top of* the mask, fully opaque.

## Required packages

```bash
npx expo install expo-blur expo-linear-gradient \
  @react-native-masked-view/masked-view react-native-reanimated
```

All are **native modules** — after adding them you must rebuild the dev client
(`npx expo prebuild && npx expo run:ios`); they will not hot-load into an old build.

## Drop-in component

```tsx
// components/BlurHeader.tsx
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type Props = {
  /** Scroll offset (px) of the list beneath the header. */
  scrollY: SharedValue<number>;
  /** Full header height, including the status-bar inset. */
  height: number;
  /** Header content (title, actions). Stays fully opaque — it is NOT masked. */
  children: ReactNode;
  /** Peak blur once scrolled (0 = crisp at the very top). */
  maxIntensity?: number;
  tint?: "light" | "dark" | "default";
  /** Translucent wash behind the title for legibility over busy images. */
  washColor?: string;
  /** Where the mask fades: opaque until `fadeStart`, transparent by the bottom. */
  fadeStart?: number; // 0..1
};

export function BlurHeader({
  scrollY,
  height,
  children,
  maxIntensity = 28,
  tint = "light",
  washColor = "rgba(255,255,255,0.6)",
  fadeStart = 0.6,
}: Props) {
  // Blur + wash ramp in as content scrolls under the header.
  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(
      scrollY.value,
      [0, 48],
      [0, maxIntensity],
      Extrapolation.CLAMP,
    ),
  }));
  const washStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 28], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.overlay, { height }]} pointerEvents="box-none">
      <MaskedView
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        // Mask alpha: 1 (opaque) at top → 0 (hidden) at bottom, so the frosted
        // area dissolves into the content with no hard edge.
        maskElement={
          <LinearGradient
            style={StyleSheet.absoluteFill}
            colors={["black", "black", "transparent"] as const}
            locations={[0, fadeStart, 1] as const}
          />
        }
      >
        <AnimatedBlurView
          animatedProps={blurProps}
          tint={tint}
          experimentalBlurMethod="dimezisBlurView" // real blur on Android; iOS ignores
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: washColor }, washStyle]}
        />
      </MaskedView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0 },
});
```

## Wiring it into a screen

The list scrolls **under** the header, so give it a top content inset equal to
the header height, and feed its scroll offset to `scrollY`.

```tsx
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();
const HEADER_H = insets.top + 56; // 56 = your title row height
const scrollY = useSharedValue(0);

<View style={{ flex: 1 }}>
  <FlashList /* or FlatList / Animated.ScrollView */
    data={items}
    renderItem={renderItem}
    onScroll={(e) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    }}
    scrollEventThrottle={16}
    contentContainerStyle={{ paddingTop: HEADER_H + 8 }}
  />

  <BlurHeader scrollY={scrollY} height={HEADER_H}>
    <View style={{ paddingTop: insets.top }}>
      {/* Title, count, actions — fully opaque, on top of the mask */}
    </View>
  </BlurHeader>
</View>
```

## Tuning & gotchas

- **Still see an edge?** Fade earlier: `fadeStart={0.4}`, and/or lower
  `washColor` opacity. Larger `fadeStart` keeps more solid frost behind the title.
- **Crisp at the top on purpose:** intensity starts at 0 so nothing looks
  frosted before the user scrolls; it ramps up over the first ~48px.
- **Frame-locked scroll:** the JS `onScroll` above is smooth enough for a header.
  For perfectly frame-locked updates, wrap the list in
  `Animated.createAnimatedComponent(...)` and use `useAnimatedScrollHandler`.
- **MaskedView masks by the mask element's alpha** — `black` = keep, `transparent`
  = hide. Works reliably on iOS; on Android the wash is the visible fallback if
  masked blur composites poorly.
- **Never add a `borderBottom` to a "seamless" header** — that single hairline is
  the most common cause of the visible boundary.
- Keep the app/page background and the wash in the same color family (e.g. white
  page → white wash) so the fade is invisible.
