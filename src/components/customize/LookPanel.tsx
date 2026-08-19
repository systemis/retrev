import { ScrollView, View } from "react-native";
import { FILM_PARAMS } from "@/src/design/params";
import type { RetroFadeParams } from "@/src/filter/RetroFade";
import { LabeledSlider } from "./LabeledSlider";
import { PresetStrip } from "./PresetStrip";

type Props = {
  film: RetroFadeParams;
  presetId: string | null;
  onSelectPreset: (id: string) => void;
  onChangeParam: (key: keyof RetroFadeParams, value: number) => void;
};

/** Film look controls: one-tap presets + fine-tune sliders. */
export function LookPanel({
  film,
  presetId,
  onSelectPreset,
  onChangeParam,
}: Props) {
  return (
    <View>
      <PresetStrip activeId={presetId} onSelect={onSelectPreset} />
      <ScrollView
        style={{ maxHeight: 280 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {FILM_PARAMS.map((p) => (
          <LabeledSlider
            key={p.key}
            label={p.label}
            value={film[p.key]}
            min={p.min}
            max={p.max}
            step={p.step}
            onChange={(v) => onChangeParam(p.key, v)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
