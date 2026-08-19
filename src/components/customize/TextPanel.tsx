import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextAlign, TextLayer } from "@/src/design/types";
import type { FontKey } from "@/src/text/fonts";
import { colors, radius, spacing, type } from "@/src/theme";
import { ColorSwatches } from "./ColorSwatches";
import { FontPicker } from "./FontPicker";
import { LabeledSlider } from "./LabeledSlider";
import { SegmentedControl } from "./SegmentedControl";

type Props = {
  layers: TextLayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onChange: (patch: Partial<TextLayer>) => void;
  onDelete: () => void;
};

const ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function TextPanel({
  layers,
  selectedId,
  onSelect,
  onAdd,
  onChange,
  onDelete,
}: Props) {
  const selected = layers.find((l) => l.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        {layers.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {layers.map((l, i) => (
              <Pressable
                key={l.id}
                onPress={() => onSelect(l.id)}
                style={[styles.chip, l.id === selectedId && styles.chipActive]}
              >
                <Text style={type.caption} numberOfLines={1}>
                  {l.content || `Text ${i + 1}`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable onPress={onAdd} style={styles.addBtn}>
          <Text style={styles.addText}>+ Add</Text>
        </Pressable>
      </View>

      {selected ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={selected.content}
            onChangeText={(content) => onChange({ content })}
            placeholder="Your text"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <FontPicker
            value={selected.fontKey as FontKey}
            onChange={(fontKey) => onChange({ fontKey })}
          />
          <View style={styles.pad}>
            <ColorSwatches
              value={selected.color}
              onChange={(color) => onChange({ color })}
            />
          </View>
          <LabeledSlider
            label="Size"
            value={selected.sizePct}
            min={0.05}
            max={0.3}
            step={0.005}
            onChange={(sizePct) => onChange({ sizePct })}
          />
          <View style={styles.pad}>
            <SegmentedControl<TextAlign>
              options={ALIGN_OPTIONS}
              value={selected.align}
              onChange={(align) => onChange({ align })}
            />
          </View>
          <Pressable onPress={onDelete} style={styles.delete}>
            <Text style={styles.deleteText}>Delete text</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <Text style={[type.body, styles.hint]}>
          Add text, then drag it on the photo to place it.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chips: {
    gap: spacing.sm,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 120,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  addBtn: {
    marginLeft: "auto",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  addText: {
    ...type.caption,
    color: "#FFFFFF",
  },
  body: {
    maxHeight: 300,
  },
  input: {
    ...type.body,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    color: colors.textPrimary,
  },
  pad: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  delete: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  deleteText: {
    ...type.body,
    color: "#C0392B",
  },
  hint: {
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
