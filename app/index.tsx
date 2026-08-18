import { EmptyLibrary } from "@/src/components/EmptyLibrary";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { ShutterButton } from "@/src/components/ShutterButton";
import { StampCard } from "@/src/components/StampCard";
import type { PhotoRecord } from "@/src/db/photos";
import { stampDate } from "@/src/lib/date";
import { haptics } from "@/src/lib/haptics";
import { usePhotoStore } from "@/src/store/usePhotoStore";
import { colors, layout, spacing, type, useReduceMotion } from "@/src/theme";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { width: screenW } = useWindowDimensions();

  const photos = usePhotoStore((s) => s.photos);
  const hydrated = usePhotoStore((s) => s.hydrated);
  const newestId = usePhotoStore((s) => s.newestId);
  const load = usePhotoStore((s) => s.load);
  const remove = usePhotoStore((s) => s.remove);
  const clearNewest = usePhotoStore((s) => s.clearNewest);

  useEffect(() => {
    load(db);
  }, [db, load]);

  // Let the fresh stamp's drop-in play once after returning home, then clear it.
  useFocusEffect(
    useCallback(() => {
      if (!newestId) return;
      const id = setTimeout(clearNewest, 1000);
      return () => clearTimeout(id);
    }, [newestId, clearNewest]),
  );

  const columnWidth = (screenW - layout.screenPadding * 2) / 2;
  const cardWidth = columnWidth - layout.gridGutter;

  const confirmDelete = useCallback(
    (record: PhotoRecord) => {
      Alert.alert("Delete this stamp?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            haptics.delete();
            remove(db, record.id);
          },
        },
      ]);
    },
    [db, remove],
  );

  const renderItem = useCallback(
    ({ item }: { item: PhotoRecord }) => (
      <View style={[styles.cell, { width: columnWidth }]}>
        <StampCard
          uri={item.uri}
          dateLabel={stampDate(item.createdAt)}
          width={cardWidth}
          dropIn={item.id === newestId}
          reduceMotion={reduceMotion}
          onLongPress={() => confirmDelete(item)}
        />
      </View>
    ),
    [columnWidth, cardWidth, newestId, reduceMotion, confirmDelete],
  );

  const showEmpty = hydrated && photos.length === 0;

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Faded"
          right={
            photos.length > 0 ? (
              <Text style={type.caption}>
                {photos.length} {photos.length === 1 ? "frame" : "frames"}
              </Text>
            ) : null
          }
        />
      </View>

      {showEmpty ? (
        <EmptyLibrary />
      ) : (
        <Animated.View
          style={styles.listWrap}
          entering={reduceMotion ? undefined : FadeIn.duration(280)}
        >
          <FlashList
            data={photos}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}

      <View
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        pointerEvents="box-none"
      >
        <ShutterButton onPress={() => router.push("/camera")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: 140,
  },
  cell: {
    alignItems: "center",
    marginBottom: layout.gridGutter,
  },
  fab: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
