import { EmptyLibrary } from "@/src/components/EmptyLibrary";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { ShutterButton } from "@/src/components/ShutterButton";
import { StampCard } from "@/src/components/StampCard";
import type { PhotoRecord } from "@/src/db/photos";
import { stampDate } from "@/src/lib/date";
import { haptics } from "@/src/lib/haptics";
import { usePhotoStore } from "@/src/store/usePhotoStore";
import { colors, layout, spacing, type, useReduceMotion } from "@/src/theme";
import MaskedView from "@react-native-masked-view/masked-view";
import { FlashList } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect } from "react";
import {
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
/** Height of the header content below the status bar. */
const HEADER_CONTENT_H = 56;

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

  const scrollY = useSharedValue(0);

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
  const headerHeight = insets.top + HEADER_CONTENT_H;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  // Frosted header: blur intensity + hairline appear as content scrolls under it.
  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(scrollY.value, [0, 48], [0, 28], Extrapolation.CLAMP),
  }));
  const headerFillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 28], [0, 1], Extrapolation.CLAMP),
  }));

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
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: layout.screenPadding,
              paddingTop: headerHeight + spacing.sm,
              paddingBottom: 140,
            }}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}

      {/* Frosted header that dissolves into the list — the blur fades to
          transparent at the bottom so there's no hard seam with the content. */}
      <View
        style={[styles.headerOverlay, { height: headerHeight }]}
        pointerEvents="box-none"
      >
        <MaskedView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              style={StyleSheet.absoluteFill}
              colors={["black", "black", "transparent"] as const}
              locations={[0, 0.6, 1] as const}
            />
          }
        >
          <AnimatedBlurView
            animatedProps={blurProps}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.headerWash, headerFillStyle]}
          />
        </MaskedView>
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
      </View>

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
  cell: {
    alignItems: "center",
    marginBottom: layout.gridGutter,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerWash: {
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  fab: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
