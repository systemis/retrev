# Customizable Stamp Design — Feature Tracker

Living doc for the stamp customization feature. Updated as each milestone lands.

## Goal

Make stamps **customizable and re-editable**: film look (presets + sliders), stamp frame
(paper tint, perforation, border), photo crop/zoom, date label, and **text-on-image with
several fonts** — via a shared **Customize screen** reached from the Result screen and by
re-editing a stamp from the gallery.

## Core architecture change

Stop "flatten once, discard raw". Instead persist **original photo + a `design` spec** and
**re-render the composite** (crop → film shader → baked text) on demand.

- Original photo → `documentDirectory/originals/<id>.jpg`.
- Rendered composite (displayed inside the stamp) → `documentDirectory/photos/<id>-<version>.jpg`
  (versioned filename so image caches refresh after a re-edit).
- The perforated frame + date label stay **UI** drawn by `StampPaper` from `design`.
- DB `photos`: `id, uri (rendered), source_uri, created_at, updated_at, design (JSON), params (legacy, nullable)`.

### `StampDesign` (src/design/types.ts)
`{ version, presetId, film: RetroFadeParams, crop{scale,offsetX,offsetY}, frame{paper,tooth,border},
label{enabled,format}, texts: TextLayer[] }`

## Key modules

| Area | File |
|---|---|
| Design types & presets | `src/design/types.ts`, `src/design/presets.ts` |
| Create on capture | `src/design/createStamp.ts` (`createStampFromCapture`) |
| Render composite | `src/filter/renderStamp.ts` (reuses `RetroFade` shader + offscreen pattern) |
| Fonts (M5) | `src/text/fonts.ts` |
| Persistence | `src/db/{schema,index,photos}.ts`, `src/store/usePhotoStore.ts` |
| Editor UI | `app/(capture)/customize.tsx`, `src/components/customize/*` |
| Frame render | `src/components/StampPaper.tsx` (+ `stampPath.ts`) |

## Milestones

- [x] **M1 — Foundation.** Data model + migration + repo; design types + presets; `renderStamp`
  (crop-capable, no text); persist original; `createStampFromCapture`; `store.update`; processing
  rewire. *No visible change yet.* (StampPaper frame/label props moved to M3, where the panel wires them.)
- [x] **M2 — Customize screen + Look.** `/customize` route, live preview, preset strip + 7 sliders,
  Save re-renders. Result "Customize" button; gallery tap → customize.
- [x] **M3 — Frame + Date panels.**
- [x] **M4 — Crop / zoom.**
- [x] **M5 — Text + fonts.** (Framed Save-to-Photos export deferred — see notes.)

## Decisions / notes

- Film presets: 70s Fade, Portra, Cinestill, B&W (saturation 0), Cool Fade, Vivid + full 7-param sliders.
- Output photo aspect fixed at `STAMP_PHOTO_ASPECT` (portrait); frame drawn around it by `StampPaper`.
- Legacy rows (pre-feature): `source_uri = uri`, `film = IDENTITY` so re-render doesn't double-grade.
- New native deps (need `expo prebuild`): `@react-native-community/slider`, `@expo-google-fonts/*` (JS assets).
- Verification each milestone: `npx tsc --noEmit` + `npx expo export --platform ios`; device steps per milestone.

## Progress log

- **M1 done.** New: `src/design/{types,presets,createStamp}.ts`, `src/filter/renderStamp.ts`.
  Changed: `src/lib/files.ts` (originals dir + versioned render output + 2-dir prune),
  `src/db/{schema,index,photos}.ts` (source_uri/design/updated_at + `user_version` migration +
  `updatePhoto`), `src/store/usePhotoStore.ts` (`update` re-render action), `app/(capture)/processing.tsx`
  (`createStampFromCapture`), `app/_layout.tsx` (ensure originals dir). Removed `src/filter/applyFilter.ts`.
  Verified: `tsc` 0, iOS export 0. Capture flow unchanged visually; now persists original + design.
- **M2 done.** Added `@react-native-community/slider`. New: `src/design/params.ts` (7-param slider specs),
  `src/components/customize/{FilmImage,CustomizePreview,LabeledSlider,PresetStrip,LookPanel}.tsx`,
  `app/(capture)/customize.tsx`. Live preview shows the ORIGINAL photo graded by the working design
  (via `FilmImage` = declarative twin of `renderStamp`); presets + sliders edit `design.film`; Save →
  `store.update` re-renders + persists. Wired `(capture)/_layout` route, Result "Customize" button
  (+ made Result read the store reactively so edits reflect on return), and gallery tap → customize.
  Verified: `tsc` 0, iOS export 0. **New native module → needs `expo prebuild` before it runs on device.**
- **M3 done.** Editor tab bar (`SegmentedControl`). `FramePanel` (paper tint white/cream/kraft, perforation,
  border) + `DatePanel` (toggle + dotted/slash). Parametrized `StampPaper`/`stampInnerRect` by frame;
  `StampCard`/`DevelopReveal`/`CustomizePreview` pass `design.frame`/`label`; `stampDate(epoch, format)`.
  New: `src/design/frame.ts`, `src/components/customize/{SegmentedControl,FramePanel,DatePanel}.tsx`.
- **M4 done.** Pinch+pan crop on the preview (`FilmImage` computes the cover rect from crop, matching
  `renderStamp`); shared-value gestures committed to `design.crop` via `runOnJS`; `CropPanel` (Reset).
  `renderStamp` already baked crop in M1. New: `src/components/customize/CropPanel.tsx`.
- **M5 done.** Added `@expo-google-fonts/{playfair-display,pacifico,bebas-neue,caveat,dm-serif-display}`.
  New: `src/text/fonts.ts` (registry + `useEditorTypefaces` preview + `loadTypeface` bake via expo-asset),
  `src/components/customize/{TextLayers,FontPicker,ColorSwatches,TextPanel}.tsx`. Add/select/edit text
  layers (content, font, color, size, align), drag to place on the photo (Pan gesture, text tab), baked
  into the render (`Skia.Font`+`drawText`, rotation-aware). Verified each: `tsc` 0, iOS export 0.
- **Deferred:** framed Save-to-Photos (bakes the perforated frame into the exported image) — Save currently
  exports the composited photo (film+crop+text). New native modules across M2–M5 (slider, fonts) →
  **`expo prebuild` + `run:ios` required** before the editor runs on device.
