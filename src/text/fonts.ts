import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import { Skia, type SkTypeface, useFont } from "@shopify/react-native-skia";
import { Asset } from "expo-asset";
import { useMemo } from "react";

export type FontKey =
  | "playfair"
  | "dmserif"
  | "bebas"
  | "caveat"
  | "pacifico"
  | "mono";

type FontEntry = { key: FontKey; label: string; sample: string; module: number };

const SpaceMono = require("../../assets/fonts/SpaceMono-Regular.ttf");

/** Beautiful display fonts offered for text-on-image. */
export const FONTS: Record<FontKey, FontEntry> = {
  playfair: { key: "playfair", label: "Playfair", sample: "Aa", module: PlayfairDisplay_600SemiBold },
  dmserif: { key: "dmserif", label: "DM Serif", sample: "Aa", module: DMSerifDisplay_400Regular },
  bebas: { key: "bebas", label: "Bebas", sample: "AA", module: BebasNeue_400Regular },
  caveat: { key: "caveat", label: "Caveat", sample: "Aa", module: Caveat_600SemiBold },
  pacifico: { key: "pacifico", label: "Pacifico", sample: "Aa", module: Pacifico_400Regular },
  mono: { key: "mono", label: "Mono", sample: "Aa", module: SpaceMono },
};

export const FONT_KEYS: FontKey[] = [
  "playfair",
  "dmserif",
  "bebas",
  "caveat",
  "pacifico",
  "mono",
];
export const DEFAULT_FONT_KEY: FontKey = "playfair";

export function isFontKey(k: string): k is FontKey {
  return k in FONTS;
}

// ── Headless baking (renderStamp) ────────────────────────────────────────────
const typefaceCache = new Map<FontKey, SkTypeface>();

/** Load a typeface for offscreen text baking (cached across renders). */
export async function loadTypeface(key: FontKey): Promise<SkTypeface | null> {
  const cached = typefaceCache.get(key);
  if (cached) return cached;
  const asset = Asset.fromModule(FONTS[key].module);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const data = await Skia.Data.fromURI(uri);
  const tf = Skia.Typeface.MakeFreeTypeFaceFromData(data);
  if (tf) typefaceCache.set(key, tf);
  return tf;
}

// ── Live preview ─────────────────────────────────────────────────────────────
/** Load all editor typefaces for the live preview (fixed set → fixed hooks). */
export function useEditorTypefaces(): Partial<Record<FontKey, SkTypeface>> {
  const playfair = useFont(FONTS.playfair.module, 24);
  const dmserif = useFont(FONTS.dmserif.module, 24);
  const bebas = useFont(FONTS.bebas.module, 24);
  const caveat = useFont(FONTS.caveat.module, 24);
  const pacifico = useFont(FONTS.pacifico.module, 24);
  const mono = useFont(FONTS.mono.module, 24);

  return useMemo(() => {
    const map: Partial<Record<FontKey, SkTypeface>> = {};
    if (playfair) map.playfair = playfair.getTypeface() ?? undefined;
    if (dmserif) map.dmserif = dmserif.getTypeface() ?? undefined;
    if (bebas) map.bebas = bebas.getTypeface() ?? undefined;
    if (caveat) map.caveat = caveat.getTypeface() ?? undefined;
    if (pacifico) map.pacifico = pacifico.getTypeface() ?? undefined;
    if (mono) map.mono = mono.getTypeface() ?? undefined;
    return map;
  }, [playfair, dmserif, bebas, caveat, pacifico, mono]);
}
