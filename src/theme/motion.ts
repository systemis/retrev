import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Default spring — spring-based, not linear (dev-plan §4.4). */
export const spring = { damping: 18, stiffness: 180, mass: 0.9 } as const;
/** Softer spring for large/settling motion (stamp drop, sheet). */
export const softSpring = { damping: 22, stiffness: 140, mass: 1 } as const;

/** Timing fallbacks (ms) used when reduce-motion is on, or for simple fades. */
export const timing = { fast: 180, medium: 260, slow: 420 } as const;

/** Entrances stagger by ~40ms; nothing appears instantly. */
export const staggerDelay = (index: number, step = 40) => index * step;

/** Minimum on-screen time for the "developing" animation so it reads as intentional. */
export const MIN_DEVELOP_MS = 1200;

/**
 * Tracks the OS "reduce motion" setting reactively. All entrances/reveals should
 * degrade to simple fades (or appear instantly) when this is true (dev-plan §12).
 */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) =>
      setReduced(v),
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
