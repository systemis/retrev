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
- [ ] **M2 — Customize screen + Look.** `/customize` route, live preview, preset strip + 7 sliders,
  Save re-renders. Result "Customize" button; gallery tap → customize.
- [ ] **M3 — Frame + Date panels.**
- [ ] **M4 — Crop / zoom.**
- [ ] **M5 — Text + fonts** + framed Save-to-Photos export.

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
- _(M2 next: Customize screen + Look panel.)_
