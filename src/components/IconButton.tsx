import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, spring } from "@/src/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  name: ComponentProps<typeof Feather>["name"];
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  /** Circular background; defaults to a translucent surface chip. */
  background?: string;
  diameter?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A round, tappable icon with a subtle spring press (dev-plan §6.6). */
export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  size = 22,
  color = colors.textPrimary,
  background = "transparent",
  diameter = 44,
  disabled = false,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.86, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
      style={[
        styles.base,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: background,
          opacity: disabled ? 0.4 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      <Feather name={name} size={size} color={color} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
