import * as Haptics from "expo-haptics";

/** Best-effort — haptics can reject on unsupported hardware; never let that surface. */
function safe(run: () => Promise<unknown>): void {
  run().catch(() => {});
}

/**
 * Haptics for committal actions (dev-plan §9.6):
 * capture → impactMedium, save → notificationSuccess, delete → impactLight.
 */
export const haptics = {
  capture: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  save: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  delete: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  light: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  error: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
};
