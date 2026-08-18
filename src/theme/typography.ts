import type { TextStyle } from "react-native";
import { colors } from "./colors";

/**
 * Font family keys. These must match the keys passed to `useFonts` in the root
 * layout: Inter comes from `@expo-google-fonts/inter`, the mono stamp label
 * uses the bundled SpaceMono (dev-plan §4.2).
 */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  mono: "SpaceMono",
} as const;

/** Type scale: display 28/600, title 20/600, body 15/400, caption 12/500, mono-stamp 11. */
export const type = {
  display: {
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  } as TextStyle,
  title: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
  } as TextStyle,
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  } as TextStyle,
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,
  /** Film date stamp — mono, letter-spaced (e.g. `'26 08 18`). */
  monoStamp: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  } as TextStyle,
} as const;
