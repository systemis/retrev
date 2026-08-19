import { useLocalSearchParams, useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DevelopReveal } from "@/src/components/DevelopReveal";
import { getPhoto, type PhotoRecord } from "@/src/db/photos";
import { stampDate } from "@/src/lib/date";
import { haptics } from "@/src/lib/haptics";
import { usePhotoStore } from "@/src/store/usePhotoStore";
import { colors, radius, spacing, type, useReduceMotion } from "@/src/theme";

export default function ResultScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { width: screenW } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Read reactively from the store so a re-edit (Customize) reflects on return.
  const storeRecord = usePhotoStore((s) => s.photos.find((p) => p.id === id));
  const remove = usePhotoStore((s) => s.remove);
  const [fallback, setFallback] = useState<PhotoRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const record = storeRecord ?? fallback;

  // Fallback load if the store hasn't caught up (e.g. deep-linked).
  useEffect(() => {
    if (storeRecord || !id) return;
    getPhoto(db, id).then(setFallback);
  }, [storeRecord, id, db]);

  const paperW = Math.min(300, screenW * 0.74);
  const dismiss = () => router.dismissAll();

  const onSave = async () => {
    if (!record) return;
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return;
      await MediaLibrary.saveToLibraryAsync(record.uri);
      haptics.save();
      setSaved(true);
    } catch {
      haptics.error();
    }
  };

  const onDiscard = () => {
    if (!record) return;
    haptics.delete();
    remove(db, record.id);
    dismiss();
  };

  const entering = (i: number) =>
    reduceMotion ? undefined : FadeInUp.delay(150 + i * 60).springify().damping(18);

  if (!record) return <View style={styles.screen} />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.stage}>
        <DevelopReveal
          uri={record.uri}
          width={paperW}
          dateLabel={stampDate(record.createdAt, record.design.label.format)}
          frame={record.design.frame}
          showLabel={record.design.label.enabled}
        />
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View entering={entering(0)}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: pressed ? colors.accentPressed : colors.accent },
            ]}
            onPress={dismiss}
          >
            <Text style={styles.primaryText}>Keep</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={entering(1)}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondary,
              { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
            ]}
            onPress={() =>
              router.push({ pathname: "/customize", params: { id: record.id } })
            }
          >
            <Text style={styles.secondaryText}>Customize</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={entering(2)}>
          <Pressable
            accessibilityRole="button"
            disabled={saved}
            style={({ pressed }) => [
              styles.secondary,
              { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
            ]}
            onPress={onSave}
          >
            <Text style={styles.secondaryText}>
              {saved ? "Saved to Photos ✓" : "Save to Photos"}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={entering(3)}>
          <Pressable
            accessibilityRole="button"
            style={styles.discard}
            onPress={onDiscard}
          >
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primary: {
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  primaryText: {
    ...type.title,
    color: "#FFFFFF",
  },
  secondary: {
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    ...type.body,
    fontFamily: type.title.fontFamily,
    color: colors.textPrimary,
  },
  discard: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  discardText: {
    ...type.body,
    color: colors.textSecondary,
  },
});
