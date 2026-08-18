import type { ViewStyle } from "react-native";
import { colors } from "./colors";

/**
 * Warm soft shadows — the core of the "physical stamps on a page" feel in a
 * light theme (dev-plan §4.4). Elevation is expressed as shadow, never as a
 * lighter surface. Animate shadow + scale together on press / drop-in.
 */
export const shadows = {
  stamp: {
    shadowColor: colors.shadowSolid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  } satisfies ViewStyle,
  stampPressed: {
    shadowColor: colors.shadowSolid,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  } satisfies ViewStyle,
  fab: {
    shadowColor: colors.shadowSolid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  } satisfies ViewStyle,
} as const;
