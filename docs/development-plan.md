# Faded — Retro Film Camera App · Development Plan

> **For:** Claude Code
> **Working title:** *Faded* (placeholder — rename freely)
> **Platform:** Expo React Native (New Architecture), iOS-first, Android-compatible
> **One-liner:** Capture an instant photo, run it through a 70s-faded film shader, and collect the results as perforated "stamps" in a bright, paper-inspired, animated gallery.

This document is self-contained. The GPU filter (an SkSL shader) is included verbatim in **Appendix A** so it can be dropped straight into the project.

---

## 1. Product Summary

A minimal, aesthetic camera app for personal use (no commercial/analytics/monetization concerns). The entire experience is three moves:

1. **Browse** a gallery of previously captured+filtered photos, each rendered as a *stamp* (a bordered card with a perforated notched bottom edge).
2. **Capture** a new photo via a centered shutter button.
3. **Process → Reveal**: watch a short "developing" animation, then see the finished faded photo drop into the gallery.

Design north star: **light, warm, paper-like, modern, and richly animated** — a bright cream "album page" on which stamps sit with soft shadows. Every transition should feel deliberate and physical (film developing, stamps dropping onto the page, shutter flashing).

---

## 2. Core User Flow

```
┌─────────────┐   tap shutter    ┌────────────┐   take photo   ┌──────────────┐   done   ┌────────────┐
│  HOME /     │ ───────────────► │  CAMERA    │ ─────────────► │  PROCESSING  │ ───────► │  RESULT    │
│  LIBRARY    │                  │  (capture) │                │  (developing │          │  (reveal)  │
│  (grid)     │ ◄─────────────────────────────────────────────┴──────────────┘          └─────┬──────┘
└─────────────┘        new stamp animates into the grid                                        │
       ▲                                                                                       │
       └───────────────────────────  save & return  ─────────────────────────────────────────┘
```

- **Home → Camera**: shutter FAB triggers a modal navigation to the camera.
- **Camera → Processing**: on capture, immediately push the Processing screen with the raw photo URI.
- **Processing → Result**: apply the shader, snapshot the result to a file, persist metadata, then replace Processing with Result.
- **Result → Home**: on save, dismiss the modal flow; the new stamp animates into the top-left of the grid via a layout animation.
- **Result → discard**: delete the temp file and return to Home unchanged.

---

## 3. Tech Stack (verify with `npx expo install`)

| Concern | Library | Notes |
|---|---|---|
| Runtime | **Expo SDK 57** | Latest; fixes the Hermes v1 memory regression from SDK 55/56. **New Architecture only.** |
| Navigation | **expo-router** | File-based routing; use a modal group for the capture flow. |
| Camera | **expo-camera** | `CameraView`, `takePictureAsync`, permissions hooks. |
| GPU filter | **@shopify/react-native-skia** (2.6+) | SkSL runtime shader + offscreen snapshot. Requires a **dev build** (not Expo Go). |
| Animations | **react-native-reanimated** v4 | New-Arch only; pulls in `react-native-worklets`. |
| Gestures | **react-native-gesture-handler** | Peer for Reanimated interactions. |
| Grid list | **@shopify/flash-list** v4 | Performant 2-column masonry/grid; New-Arch only. |
| Local files | **expo-file-system** | Persist filtered images in `documentDirectory`. |
| Metadata store | **expo-sqlite** | Source of truth for the photo list (queryable, ordered). |
| Save to camera roll | **expo-media-library** | Optional "Also save to Photos" action. |
| Haptics | **expo-haptics** | Shutter, save, long-press feedback. |
| Fonts | **expo-font** | Inter (UI) + a monospace (stamp date labels). |

**Hard requirements**
- The app runs on the **New Architecture** — this is mandatory for SDK 57 and the libraries above.
- Skia and expo-camera require a **development build**: `npx expo run:ios` / `run:android`. The app will **not** run in Expo Go.
- Always install native deps with `npx expo install <pkg>` so versions stay SDK-compatible. Run `npx expo-doctor` after installs.

---

## 4. Design System

Create `src/theme/` with tokens consumed everywhere. No hard-coded colors in components.

### 4.1 Palette (light, warm, paper-inspired to echo the film/album theme)

Primary theme is **light**. Backgrounds are a warm cream "album page"; stamps are near-white cards lifted off the page with soft shadows. Depth comes from **shadows**, not from lighter surfaces (the opposite of a dark theme).

| Token | Value | Use |
|---|---|---|
| `bg` | `#F6F1E7` | App background (warm cream album page). |
| `surface` | `#FFFDF8` | Cards, sheets (near-white, faintly warm). |
| `surfacePressed` | `#EFE8DA` | Pressed/hover states on surfaces. |
| `border` | `#E4DCCB` | Warm hairline separators, stamp inner edge. |
| `textPrimary` | `#221E17` | Warm near-black. |
| `textSecondary` | `#8A8172` | Meta, timestamps (warm gray). |
| `accent` | `#C56A3D` | Burnt-sienna / terracotta — shutter ring, highlights (reads strongly on cream). |
| `accentPressed` | `#A8552E` | Accent pressed. |
| `stampPaper` | `#FFFFFF` | Stamp border/paper — pure white so stamps pop against the cream page. |
| `shadow` | `rgba(60, 44, 24, 0.16)` | Warm soft shadow for stamp/FAB elevation. |

> Optional (stretch): add a dark variant later by swapping this token set. Keep all components token-driven so a theme switch is trivial.

### 4.2 Typography
- **UI:** Inter (400/500/600).
- **Stamp date label:** a monospace (e.g. Space Mono / JetBrains Mono) at ~11px, letter-spaced, to evoke a film date stamp (e.g. `'26 08 18`).
- Scale: display 28/600, title 20/600, body 15/400, caption 12/500, mono-stamp 11.

### 4.3 Spacing & radius
- 4-pt spacing scale: 4, 8, 12, 16, 24, 32.
- Grid gutter: 12. Screen padding: 16.
- Card radius: 14; shutter button: full circle.

### 4.4 Motion principles
- **Spring-based**, not linear. Default spring: `{ damping: 18, stiffness: 180, mass: 0.9 }`.
- Entrances stagger by ~40ms. Nothing appears instantly.
- Respect `AccessibilityInfo.isReduceMotionEnabled` — fall back to fades.
- Haptics accompany committal actions (capture, save).
- **Elevation via soft warm shadows** (token `shadow`), not surface lightening — this is what sells the "physical stamps on a page" feel in a light theme. Animate shadow/scale together on press and on the new-stamp drop.

---

## 5. Screens & Navigation

Use **expo-router**. The capture flow is a modal group so it slides over the gallery.

```
app/
  _layout.tsx            // Root Stack + ThemeProvider + DB init + font loading (splash gate)
  index.tsx              // HOME / LIBRARY
  (capture)/
    _layout.tsx          // modal stack (presentation: 'modal' or 'fullScreenModal')
    camera.tsx           // CAMERA
    processing.tsx       // PROCESSING (receives rawUri param)
    result.tsx           // RESULT (receives filteredId param)
```

### 5.1 Home / Library (`app/index.tsx`)
- Header: app title (left), small count of photos (right).
- **FlashList**, `numColumns={2}`, renders `StampCard` items ordered by `createdAt DESC`.
- **Empty state**: centered illustration + copy ("No shots yet — tap to capture your first frame."), with a gentle floating animation.
- **Shutter FAB**: centered at the bottom, floating above the list (absolute), with a warm accent ring. Safe-area aware.
- Entrance: grid items animate in with a staggered `FadeInDown` + subtle scale. New items use `LinearTransition` so insertion reflows smoothly.
- Long-press a stamp → contextual delete (scale-out + fade, then remove from DB/file).
- **Acceptance:** grid scrolls at 60fps with 100+ items; new photo appears top-left with animation; empty state shows when DB is empty.

### 5.2 Camera (`app/(capture)/camera.tsx`)
- Full-bleed `CameraView`. Top bar: close (X) + camera flip. Bottom: large capture button (mirrors the home shutter for continuity).
- Request camera permission on mount; show a permission-denied state with a "Open Settings" action.
- On capture: trigger shutter animation (white flash overlay + quick scale), haptic `impactMedium`, then `router.replace('/processing?rawUri=...')`.
- Optional: tap-to-focus, torch toggle. (Stretch.)
- **Acceptance:** preview is smooth; capture returns a valid file URI; flash + haptic fire; navigates to Processing.

### 5.3 Processing (`app/(capture)/processing.tsx`)
- Receives `rawUri`. Runs the **filter pipeline** (Section 8) to produce a saved filtered file + DB row.
- Shows a **"developing" animation** while working (Section 9.3) — minimum display time ~1.2s even if processing is faster, so it reads as intentional.
- On success: `router.replace('/result?id=<newId>')`. On failure: toast + return to camera.
- **Acceptance:** animation plays; a filtered JPEG is written to disk; a DB row is created; transitions to Result.

### 5.4 Result (`app/(capture)/result.tsx`)
- Receives `id`; loads the record. Plays a **develop-reveal** animation: the image emerges from faded/low-contrast to full look, then the stamp frame + perforation draw in (Section 9.4).
- Actions: **Keep** (default — already saved; dismiss flow to Home), **Save to Photos** (expo-media-library, optional), **Discard** (delete file + DB row, dismiss).
- **Acceptance:** reveal animation plays; Keep returns home with the new stamp animating into the grid; Discard removes all traces.

---

## 6. Key Components (`src/components/`)

### 6.1 `StampCard`
The signature UI element: a photo styled as a postage stamp with a **perforated (notched) bottom edge**.

- Structure: a white `stampPaper` frame (padding ~6px) around the filtered image, rounded top corners, a thin inner `border`, a soft warm `shadow` to lift it off the cream page, and a monospace date label at the bottom.
- **Perforation (the "rãnh"):** a row of small semicircular notches punched into the bottom edge.
  - **Primary technique (simple, performant):** overlay a row of small circles filled with the page `bg` color along the bottom edge, half-clipped below the card, so they read as bite-marks. Space them evenly; radius ~5–6px.
  - **Crisper alternative:** since Skia is already a dependency, clip the card to a Skia `Path` whose bottom edge is a scalloped line (`addArc`/`quadTo` per notch). Use this if the overlay method shows seams.
- Press: scale to 0.97 with spring; long-press opens delete.
- Props: `{ uri, dateLabel, onPress, onLongPress, index }` (index drives stagger delay).

### 6.2 `ShutterButton`
- Circular, accent ring, inner disc. Idle: a slow breathing scale (1.0 ↔ 1.03). Press: inner disc scales down, ring pulses outward. Used on both Home (FAB) and Camera.

### 6.3 `ShutterFlash`
- Full-screen white overlay that flashes opacity 0→0.9→0 (~180ms) on capture.

### 6.4 `DevelopingAnimation`
- The Processing-screen loader (Section 9.3).

### 6.5 `DevelopReveal`
- Wraps the Skia filtered image on the Result screen and animates the reveal (Section 9.4).

### 6.6 `EmptyLibrary`, `ScreenHeader`, `PermissionGate`, `IconButton`
- Small shared primitives.

---

## 7. Data & Persistence

### 7.1 Storage strategy
- **Filtered images**: written as JPEGs to `FileSystem.documentDirectory + 'photos/'`, filename `<uuid>.jpg`.
- **Metadata**: an `expo-sqlite` table is the source of truth for ordering and the filter params used.
- Do **not** rely on `expo-media-library` as the library store — camera-roll saving is an optional side action only.

### 7.2 Schema (`src/db/schema.ts`)
```sql
CREATE TABLE IF NOT EXISTS photos (
  id          TEXT PRIMARY KEY NOT NULL,
  uri         TEXT NOT NULL,          -- file:// path to the filtered JPEG
  created_at  INTEGER NOT NULL,       -- epoch ms
  params      TEXT NOT NULL           -- JSON of RetroFadeParams used
);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC);
```

### 7.3 Repository API (`src/db/photos.ts`)
- `initDb(): Promise<void>` — run migrations at app start (in root `_layout`).
- `insertPhoto(record): Promise<void>`
- `listPhotos(): Promise<PhotoRecord[]>` — ordered `created_at DESC`.
- `getPhoto(id): Promise<PhotoRecord | null>`
- `deletePhoto(id): Promise<void>` — also unlink the file.
- Expose a `usePhotos()` hook that keeps an in-memory list in a store (Zustand or React context) so the grid updates reactively after insert/delete.

---

## 8. Filter Pipeline (capture → filtered file)

This is the trickiest part. The filter is the SkSL shader in **Appendix A** (`RetroFade.tsx`, exposing `RetroFadeImage` + `SEVENTIES_FADE`).

**Approach:** render the raw photo through Skia into an **offscreen snapshot**, then encode+write it. Do this on the Processing screen so the "developing" animation covers the work.

1. Load the raw photo into a Skia image (`useImage(rawUri)`), target the photo's natural pixel dimensions (cap the long edge at e.g. 2048px for memory).
2. Mount `RetroFadeImage` inside a `<Canvas>` that has a `useCanvasRef()` ref, sized to the target dimensions. Keep it visually hidden (e.g. absolutely positioned off-screen or under the developing animation) — it still renders.
3. After the image loads and one frame has painted, snapshot and encode:

```ts
const snapshot = canvasRef.current?.makeImageSnapshot();
const base64 = snapshot?.encodeToBase64(ImageFormat.JPEG, 95);
const id = crypto.randomUUID();
const path = `${FileSystem.documentDirectory}photos/${id}.jpg`;
await FileSystem.writeAsStringAsync(path, base64!, { encoding: 'base64' });
await insertPhoto({ id, uri: path, created_at: Date.now(), params: JSON.stringify(SEVENTIES_FADE) });
```

4. Enforce a minimum on-screen time for the animation (`Promise.all([work, delay(1200)])`), then `router.replace('/result?id=' + id)`.

**Notes**
- If the on-canvas snapshot proves fiddly, use a **headless Skia surface** (`Skia.Surface.MakeOffscreen(w, h)`), draw the image + shader paint into its canvas, then `surface.makeImageSnapshot()`. Either path is acceptable; prefer whichever renders reliably at full resolution.
- Ensure the snapshot resolution matches the photo, not the screen — the visible canvas can be small while the render target is full-size (supersampling), or use the offscreen surface at full size.

---

## 9. Animation Spec

Use Reanimated v4 for layout/UI motion and Skia for pixel-level effects. Gate everything behind reduce-motion.

### 9.1 Gallery entrance & insertion
- Items: `entering={FadeInDown.delay(index * 40).springify().damping(18)}` + initial scale 0.96→1.
- Layout: `itemLayoutAnimation={LinearTransition.springify()}` on FlashList items so a newly inserted stamp pushes others down smoothly.
- New-photo emphasis: the freshly added top-left stamp does a one-time "drop + settle" (translateY from -20, slight overshoot).

### 9.2 Shutter
- FAB idle breathing loop (scale 1↔1.03, 2.4s, easeInOut).
- Press: inner disc scale→0.85, accent ring scales 1→1.4 while fading out (ripple). Haptic `impactMedium`.
- On capture: `ShutterFlash` overlay + camera preview quick scale 1→0.98→1.

### 9.3 Processing — "developing film"
Make it feel like a photo developing on paper, not a generic spinner. Suggested build (Skia), keeping it light-theme native:
- A blank **stamp-shaped card** on the cream page onto which soft, animated **grain** slowly resolves into a faint image (animate a `time` uniform in a small SkSL shader, or animate opacity of layered noise). It should read as an image surfacing on photo paper, not a dark screen.
- A slowly filling **progress arc** in the accent (terracotta) color, plus the mono label cycling `DEVELOPING…`.
- Gentle pulsing of the whole group (scale 0.98↔1.0).
- Keep it ~1.2–1.8s.

### 9.4 Result — develop reveal
- Start the Skia image with heavy fade (blur + low contrast + lifted exposure), animate a `reveal` progress 0→1 that interpolates the image from "undeveloped" to the final faded look. Two options:
  - Animate a Reanimated shared value and feed it as an extra shader uniform (e.g. lerp exposure/blur → 0). *(preferred, most filmic)*
  - Or simpler: cross-fade a blurred low-opacity copy into the sharp filtered image.
- After the image resolves, draw in the **stamp frame + perforation** (paper scales up from 0.9 with spring; notches fade/pop in sequence).
- Buttons rise with a small staggered `FadeInUp`.

### 9.5 Navigation transitions
- Home→Camera: modal slide-up (expo-router modal). Optionally a shared-element feel by animating the shutter FAB into the camera's capture button.
- Result→Home: dismiss modal; the grid insertion animation (9.1) carries the continuity.

### 9.6 Micro-interactions
- Haptics: capture (`impactMedium`), save (`notificationSuccess`), delete (`impactLight`).
- Long-press delete: card scale→0.9 + fade, then removed with `LinearTransition` reflow.

---

## 10. Project Structure

```
faded/
  app/
    _layout.tsx
    index.tsx
    (capture)/
      _layout.tsx
      camera.tsx
      processing.tsx
      result.tsx
  src/
    components/
      StampCard.tsx
      ShutterButton.tsx
      ShutterFlash.tsx
      DevelopingAnimation.tsx
      DevelopReveal.tsx
      EmptyLibrary.tsx
      ScreenHeader.tsx
      PermissionGate.tsx
      IconButton.tsx
    filter/
      RetroFade.tsx            // Appendix A
      applyFilter.ts           // offscreen render + encode + write helper
    db/
      index.ts                 // sqlite open + initDb
      schema.ts
      photos.ts                // repository
    store/
      usePhotoStore.ts         // Zustand: photos list + actions
    theme/
      colors.ts
      typography.ts
      spacing.ts
      motion.ts
    lib/
      haptics.ts
      files.ts                 // ensure dirs, delete file
      date.ts                  // stamp date label formatting
  assets/
    fonts/
```

---

## 11. Build Phases (ordered milestones)

Each phase should end in a runnable app. Check items off as completed.

- [ ] **Phase 0 — Setup.** `create-expo-app`, install stack (Appendix B), confirm New Architecture, create a dev build (`expo run:ios`), verify Skia renders a "hello" canvas. Wire fonts + splash gate.
- [ ] **Phase 1 — Theme.** Implement `src/theme/*`; a throwaway screen demonstrating colors/typography/spacing.
- [ ] **Phase 2 — Navigation skeleton.** expo-router routes + modal `(capture)` group; empty placeholder screens navigable end-to-end.
- [ ] **Phase 3 — Data layer.** sqlite init + `photos` repository + Zustand store + file helpers. Seed with a couple of dummy records to develop the grid.
- [ ] **Phase 4 — Filter pipeline.** Drop in `RetroFade.tsx`; implement `applyFilter.ts` (offscreen render → JPEG → file). Unit-test on a bundled sample image (input vs output).
- [ ] **Phase 5 — Home/Library.** FlashList 2-col grid + `StampCard` (with perforated edge) + empty state + shutter FAB. Static (reads from DB).
- [ ] **Phase 6 — Camera.** expo-camera preview, permissions, flip, capture → navigate to Processing with `rawUri`.
- [ ] **Phase 7 — Processing.** Developing animation + run pipeline + persist + navigate to Result (min-display timing).
- [ ] **Phase 8 — Result.** Develop-reveal animation + Keep / Save-to-Photos / Discard.
- [ ] **Phase 9 — Animation polish.** Staggered grid entrance, insertion `LinearTransition`, shutter ripple + flash, haptics, reduce-motion fallbacks.
- [ ] **Phase 10 — Hardening.** Permission-denied states, storage-error handling, empty/large-library performance, delete flow, safe-area on all screens.

---

## 12. Edge Cases & Permissions

- **Camera permission denied** → `PermissionGate` with "Open Settings" (Linking).
- **Media-library permission** requested only when the user taps "Save to Photos".
- **Snapshot/encode failure** → toast, delete any partial file, return to camera; never insert a broken DB row.
- **App killed mid-flow** → raw temp captures live in cache; clean orphaned temp files on launch.
- **Large library** → FlashList virtualization; lazy-load thumbnails; consider a smaller thumbnail file per photo if full-res grid is heavy.
- **Reduce motion** → all entrances/reveals degrade to simple fades.
- **Storage full** → catch write errors, surface a friendly message.

---

## 13. Stretch / Future (out of scope for v1)

- Multiple film looks (Portra, Cinestill, Y2K flash) selectable before/after capture — the shader already parameterizes this; expose presets.
- Live in-viewfinder filtering (react-native-vision-camera + Skia frame processor).
- Per-photo re-edit (adjust `RetroFadeParams` with sliders after the fact).
- Export/share sheet; light-leak & date-stamp overlays baked into the file.

---

## Appendix A — `src/filter/RetroFade.tsx`

Drop this file in as-is. It is the 70s-faded look ported to a Skia SkSL runtime shader; each uniform maps to one visual "move" so presets/sliders are trivial to add.

```tsx
import React from "react";
import {
  Canvas,
  Fill,
  Shader,
  ImageShader,
  Skia,
  useImage,
} from "@shopify/react-native-skia";

/**
 * 70s faded film look, as a Skia SkSL runtime shader.
 * Each uniform maps to exactly ONE visual move. Runs on the GPU.
 * Requires a dev build (react-native-skia is a native module; not Expo Go).
 */
const source = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float2 resolution;

uniform float warmth;            // amber cast: red up, blue down
uniform float blackLift;         // how gray the shadows get (the soul of the fade)
uniform float highlightRolloff;  // whites become cream instead of pure white
uniform float contrastAmt;       // <1 = softer, flatter
uniform float saturationAmt;     // slightly muted, warm tones survive
uniform float vignetteAmt;       // subtle edge darkening
uniform float grainAmt;          // fine film grain

float hash(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

half4 main(float2 coord) {
  half4 src = image.eval(coord);
  float3 col = float3(src.rgb);

  // 1. Contrast around mid-gray
  col = (col - 0.5) * contrastAmt + 0.5;

  // 2. Saturation (mix toward luminance)
  float luma = dot(col, float3(0.299, 0.587, 0.114));
  col = mix(float3(luma), col, saturationAmt);

  // 3. Tone curve: lift blacks + roll off highlights -> the faded core
  col = blackLift + col * (highlightRolloff - blackLift);

  // 4. Warm amber cast
  col.r += warmth * 0.5;
  col.b -= warmth * 0.5;
  col += float3(warmth * 0.15, warmth * 0.07, 0.0);

  // 5. Subtle vignette
  float2 uv = coord / resolution;
  float2 d = uv - 0.5;
  float vig = 1.0 - vignetteAmt * dot(d, d) * 2.0;
  col *= vig;

  // 6. Fine film grain
  float g = (hash(uv * resolution) - 0.5) * grainAmt;
  col += g;

  col = clamp(col, 0.0, 1.0);
  return half4(half3(col), src.a);
}
`)!;

export type RetroFadeParams = {
  warmth: number;
  blackLift: number;
  highlightRolloff: number;
  contrast: number;
  saturation: number;
  vignette: number;
  grain: number;
};

/** Solid starting point for the 70s faded vibe. Trust your eye from here. */
export const SEVENTIES_FADE: RetroFadeParams = {
  warmth: 0.06,
  blackLift: 0.12,
  highlightRolloff: 0.92,
  contrast: 0.88,
  saturation: 0.82,
  vignette: 0.35,
  grain: 0.08,
};

type Props = {
  uri: string;
  width: number;
  height: number;
  params?: RetroFadeParams;
};

export function RetroFadeImage({
  uri,
  width,
  height,
  params = SEVENTIES_FADE,
}: Props) {
  const image = useImage(uri);
  if (!image) return null;

  const uniforms = {
    resolution: [width, height],
    warmth: params.warmth,
    blackLift: params.blackLift,
    highlightRolloff: params.highlightRolloff,
    contrastAmt: params.contrast,
    saturationAmt: params.saturation,
    vignetteAmt: params.vignette,
    grainAmt: params.grain,
  };

  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader source={source} uniforms={uniforms}>
          <ImageShader
            image={image}
            fit="cover"
            rect={{ x: 0, y: 0, width, height }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
}
```

**Tuning guide:** `blackLift` is the soul of the fade (0.15–0.20 for a stronger "aged" feel); keep `grain` under 0.15 so it stays believable; for a more emphatically 70s look raise `warmth` and drop `saturation` toward ~0.75.

---

## Appendix B — Setup Commands

```bash
# 1. Scaffold (New Architecture is default on SDK 57)
npx create-expo-app@latest faded
cd faded

# 2. Install the stack (use expo install for SDK-correct versions)
npx expo install @shopify/react-native-skia expo-camera expo-media-library \
  expo-file-system expo-sqlite expo-haptics expo-font expo-router \
  react-native-reanimated react-native-gesture-handler @shopify/flash-list

# 3. State (plain npm is fine for JS-only deps)
npm install zustand

# 4. Reanimated babel plugin — add to babel.config.js:
#    plugins: ['react-native-worklets/plugin']   (Reanimated v4)

# 5. Build a dev client (NOT Expo Go — Skia + camera are native)
npx expo run:ios      # or: npx expo run:android

# 6. Sanity check dependency compatibility
npx expo-doctor
```

> After setup, verify a minimal Skia `<Canvas>` renders and expo-camera shows a live preview before proceeding to Phase 1.
