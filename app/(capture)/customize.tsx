import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CropPanel } from "@/src/components/customize/CropPanel";
import { CustomizePreview } from "@/src/components/customize/CustomizePreview";
import { DatePanel } from "@/src/components/customize/DatePanel";
import { FramePanel } from "@/src/components/customize/FramePanel";
import { LookPanel } from "@/src/components/customize/LookPanel";
import { SegmentedControl } from "@/src/components/customize/SegmentedControl";
import { TextPanel } from "@/src/components/customize/TextPanel";
import {
  stampCanvasHeight,
  stampInnerRect,
} from "@/src/components/stampPath";
import { getPhoto, type PhotoRecord } from "@/src/db/photos";
import { FILM_PRESETS } from "@/src/design/presets";
import type {
  FrameConfig,
  LabelConfig,
  StampDesign,
  TextLayer,
} from "@/src/design/types";
import type { RetroFadeParams } from "@/src/filter/RetroFade";
import { stampDate } from "@/src/lib/date";
import { haptics } from "@/src/lib/haptics";
import { uuid } from "@/src/lib/id";
import { usePhotoStore } from "@/src/store/usePhotoStore";
import { DEFAULT_FONT_KEY, useEditorTypefaces } from "@/src/text/fonts";
import { colors, spacing, type } from "@/src/theme";

const clone = (d: StampDesign): StampDesign => JSON.parse(JSON.stringify(d));

type EditorTab = "look" | "frame" | "crop" | "text" | "date";
const TAB_OPTIONS: { value: EditorTab; label: string }[] = [
  { value: "look", label: "Look" },
  { value: "frame", label: "Frame" },
  { value: "crop", label: "Crop" },
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
];

/**
 * Shared stamp editor. Reached from Result ("Customize") and by tapping a stamp
 * in the gallery. Edits a working copy of the design; Save re-renders + persists.
 */
export default function CustomizeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const storeRecord = usePhotoStore((s) => s.photos.find((p) => p.id === id));
  const update = usePhotoStore((s) => s.update);

  const [record, setRecord] = useState<PhotoRecord | null>(storeRecord ?? null);
  const [design, setDesign] = useState<StampDesign | null>(
    storeRecord ? clone(storeRecord.design) : null,
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<EditorTab>("look");

  // Crop is driven by shared values during gestures, committed to design.crop.
  const cScale = useSharedValue(1);
  const cOffX = useSharedValue(0);
  const cOffY = useSharedValue(0);
  const sScale = useSharedValue(1);
  const sOffX = useSharedValue(0);
  const sOffY = useSharedValue(0);
  const cropSynced = useRef(false);

  // Text editing.
  const typefaces = useEditorTypefaces();
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const dtX = useSharedValue(0.5);
  const dtY = useSharedValue(0.5);
  const sdtX = useSharedValue(0.5);
  const sdtY = useSharedValue(0.5);

  useEffect(() => {
    if (record || !id) return;
    getPhoto(db, id).then((r) => {
      setRecord(r);
      if (r) setDesign(clone(r.design));
    });
  }, [record, id, db]);

  // Seed the crop shared values once the design is available.
  useEffect(() => {
    if (design && !cropSynced.current) {
      cScale.value = design.crop.scale;
      cOffX.value = design.crop.offsetX;
      cOffY.value = design.crop.offsetY;
      cropSynced.current = true;
    }
  }, [design, cScale, cOffX, cOffY]);

  // Seed the text-drag shared values from the selected layer.
  useEffect(() => {
    const sel = design?.texts.find((t) => t.id === selectedTextId);
    if (sel) {
      dtX.value = sel.x;
      dtY.value = sel.y;
    }
  }, [selectedTextId, design, dtX, dtY]);

  const previewW = Math.min(300, screenW * 0.7);

  if (!record || !design) return <View style={styles.screen} />;

  const previewHeight = stampCanvasHeight(previewW);
  const previewInner = stampInnerRect(
    previewW,
    previewHeight,
    16,
    design.frame.tooth,
    design.frame.border,
  );
  const innerW = previewInner.width;
  const innerH = previewInner.height;

  const applyCrop = (scale: number, offsetX: number, offsetY: number) =>
    setDesign((d) => (d ? { ...d, crop: { scale, offsetX, offsetY } } : d));
  const resetCrop = () => {
    cScale.value = 1;
    cOffX.value = 0;
    cOffY.value = 0;
    applyCrop(1, 0, 0);
  };

  const pinch = Gesture.Pinch()
    .enabled(tab === "crop")
    .onBegin(() => {
      sScale.value = cScale.value;
    })
    .onUpdate((e) => {
      const next = Math.min(4, Math.max(1, sScale.value * e.scale));
      cScale.value = next;
      runOnJS(applyCrop)(next, cOffX.value, cOffY.value);
    });
  const pan = Gesture.Pan()
    .enabled(tab === "crop")
    .onBegin(() => {
      sOffX.value = cOffX.value;
      sOffY.value = cOffY.value;
    })
    .onUpdate((e) => {
      const s = cScale.value;
      const rx = (innerW * (s - 1)) / 2;
      const ry = (innerH * (s - 1)) / 2;
      const nx =
        rx > 0 ? Math.min(1, Math.max(-1, sOffX.value + e.translationX / rx)) : 0;
      const ny =
        ry > 0 ? Math.min(1, Math.max(-1, sOffY.value + e.translationY / ry)) : 0;
      cOffX.value = nx;
      cOffY.value = ny;
      runOnJS(applyCrop)(s, nx, ny);
    });
  const setTextPos = (x: number, y: number) => {
    if (!selectedTextId) return;
    setDesign((d) =>
      d
        ? {
            ...d,
            texts: d.texts.map((t) =>
              t.id === selectedTextId ? { ...t, x, y } : t,
            ),
          }
        : d,
    );
  };
  const textPan = Gesture.Pan()
    .enabled(tab === "text" && selectedTextId != null)
    .onBegin(() => {
      sdtX.value = dtX.value;
      sdtY.value = dtY.value;
    })
    .onUpdate((e) => {
      const nx = Math.min(1, Math.max(0, sdtX.value + e.translationX / innerW));
      const ny = Math.min(1, Math.max(0, sdtY.value + e.translationY / innerH));
      dtX.value = nx;
      dtY.value = ny;
      runOnJS(setTextPos)(nx, ny);
    });
  const gesture = Gesture.Simultaneous(pinch, pan, textPan);

  const selectPreset = (pid: string) => {
    const preset = FILM_PRESETS.find((p) => p.id === pid);
    if (!preset) return;
    setDesign((d) => (d ? { ...d, film: { ...preset.params }, presetId: pid } : d));
  };
  const changeParam = (key: keyof RetroFadeParams, value: number) => {
    setDesign((d) =>
      d ? { ...d, film: { ...d.film, [key]: value }, presetId: null } : d,
    );
  };
  const setFrame = (patch: Partial<FrameConfig>) => {
    setDesign((d) => (d ? { ...d, frame: { ...d.frame, ...patch } } : d));
  };
  const setLabel = (patch: Partial<LabelConfig>) => {
    setDesign((d) => (d ? { ...d, label: { ...d.label, ...patch } } : d));
  };
  const addText = () => {
    const layer: TextLayer = {
      id: uuid(),
      content: "TEXT",
      fontKey: DEFAULT_FONT_KEY,
      color: "#FFFFFF",
      sizePct: 0.12,
      x: 0.5,
      y: 0.5,
      rotation: 0,
      align: "center",
    };
    setDesign((d) => (d ? { ...d, texts: [...d.texts, layer] } : d));
    setSelectedTextId(layer.id);
  };
  const updateText = (patch: Partial<TextLayer>) => {
    if (!selectedTextId) return;
    setDesign((d) =>
      d
        ? {
            ...d,
            texts: d.texts.map((t) =>
              t.id === selectedTextId ? { ...t, ...patch } : t,
            ),
          }
        : d,
    );
  };
  const deleteText = () => {
    if (!selectedTextId) return;
    setDesign((d) =>
      d ? { ...d, texts: d.texts.filter((t) => t.id !== selectedTextId) } : d,
    );
    setSelectedTextId(null);
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await update(db, record.id, design);
      haptics.save();
      router.back();
    } catch {
      haptics.error();
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={type.title}>Customize</Text>
        <Pressable onPress={onSave} disabled={saving} hitSlop={10}>
          <Text style={styles.save}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        <GestureDetector gesture={gesture}>
          <CustomizePreview
            sourceUri={record.sourceUri}
            design={design}
            width={previewW}
            dateLabel={stampDate(record.createdAt, design.label.format)}
            typefaces={typefaces}
            selectedTextId={selectedTextId}
          />
        </GestureDetector>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.tabs}>
          <SegmentedControl<EditorTab>
            options={TAB_OPTIONS}
            value={tab}
            onChange={setTab}
          />
        </View>
        {tab === "look" ? (
          <LookPanel
            film={design.film}
            presetId={design.presetId}
            onSelectPreset={selectPreset}
            onChangeParam={changeParam}
          />
        ) : tab === "frame" ? (
          <FramePanel frame={design.frame} onChange={setFrame} />
        ) : tab === "crop" ? (
          <CropPanel onReset={resetCrop} />
        ) : tab === "text" ? (
          <TextPanel
            layers={design.texts}
            selectedId={selectedTextId}
            onSelect={setSelectedTextId}
            onAdd={addText}
            onChange={updateText}
            onDelete={deleteText}
          />
        ) : (
          <DatePanel label={design.label} onChange={setLabel} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancel: {
    ...type.body,
    color: colors.textSecondary,
  },
  save: {
    ...type.body,
    fontFamily: type.title.fontFamily,
    color: colors.accent,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  tabs: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
