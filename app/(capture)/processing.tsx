import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { DevelopingAnimation } from "@/src/components/DevelopingAnimation";
import { createStampFromCapture } from "@/src/design/createStamp";
import { haptics } from "@/src/lib/haptics";
import { usePhotoStore } from "@/src/store/usePhotoStore";
import { MIN_DEVELOP_MS } from "@/src/theme";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Runs the filter pipeline behind the developing animation, persists the
 * result, and advances to Result — enforcing a minimum on-screen time so the
 * animation reads as intentional (dev-plan §5.3, §8).
 */
export default function ProcessingScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { rawUri } = useLocalSearchParams<{ rawUri: string }>();
  const add = usePhotoStore((s) => s.add);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard against React double-invoke
    started.current = true;
    let cancelled = false;

    (async () => {
      try {
        if (!rawUri) throw new Error("Missing capture");
        const [result] = await Promise.all([
          createStampFromCapture(rawUri),
          delay(MIN_DEVELOP_MS),
        ]);
        await add(db, result);
        if (!cancelled) {
          router.replace({ pathname: "/result", params: { id: result.id } });
        }
      } catch {
        if (cancelled) return;
        haptics.error();
        Alert.alert("Couldn't develop that shot", "Please try again.", [
          { text: "OK", onPress: () => router.replace("/camera") },
        ]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawUri, db, add, router]);

  return <DevelopingAnimation />;
}
