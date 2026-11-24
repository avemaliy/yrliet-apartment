# Yrliet Apartment

A browser-based 3D apartment in Kraków for visual continuity, interiors and photographic reference. [Open the GitHub Pages app](https://avemaliy.github.io/yrliet-apartment/).

## Scene Studio

- In **Eksploracja**, drag to look around, use the arrows or WASD to walk, and open **Plan** for room viewpoints. Tap an object to use it or hold it to open its context controls. Settings also offers doors, windows, curtains, the sofa bed and TV.
- In **Wnętrza**, tap or choose editable furniture, move it in 10 cm steps, or rotate it in 15° steps. Reset a single item or use undo and redo. Room and table limits continue to apply.
- In **Reżyseria**, place either proxy on the floor or choose the sofa, a dining chair, or Yrliet’s bed. Adjust posture, position, height, body, head and gaze. Enable direction guides when needed.
- Use **Światło** for room switches and individual fixture controls. The camera’s room comes first. Save lighting presets with optional time and weather. **Atmosfera** controls the fictional date, time and weather independently.
- In **Aparat**, choose independent or character POV, adjust the framing and field of view, and use the thirds grid and independent camera bookmarks. Character height and posture-specific eye offsets control the height of character POVs. Use the exposure slider to set −2 to +2 EV. Automatic exposure applies a bounded correction on top of that setting using daylight and nearby fixtures. Reset returns to manual 0 EV. The exposure applies to both camera perspectives, the viewport, scene previews and exported PNGs. **Zdjęcie** enters a clean browser-viewport view. Tap the frame to toggle its controls.
- Tap a studio tab to open its sheet. Swipe its grip or use the minus and plus buttons to collapse, half-open or expand it.

## Scenes and sharing

Use **Sceny** to save, rename, duplicate, preview, update, delete, import or export complete snapshots. Restore the default apartment to reset the active scene. Named scenes and the current scene remain in browser local storage. Use JSON to move a scene to another device.

**Share Scene with Yrliet** prepares a clean PNG, versioned JSON and copyable reference text from the same snapshot. Choose whether to include character markers in the image before preparing it. Use the device share sheet where available, or download the files and copy the text. The app has no external service for sharing.

## Scene format

The app writes `appVersion: "1.1.1"` and `schemaVersion: 2`. Schema 1 snapshots migrate to sunny weather, no simulated date, independent camera and two hidden default markers. The v0.5 migration remains available, and the local storage key is unchanged. Existing snapshots without the optional `exposure` field load at manual 0 EV.

All existing fixture, furniture and room identifiers and the original camera, lighting and prop fields are retained. Camera x and y are plan coordinates in metres. Camera height is above the floor. A character’s z is the height of its placement anchor, such as a seat. Yaw is in radians, clockwise from north. Character head and gaze angles are offsets from the body and head respectively. Positive pitch looks up. Vertical FOV is in degrees. Framing is `landscape` (4:3), `portrait` (3:4) or `square` (1:1).

The `camera` field retains the independent pose and framing. The active character eye pose is derived from the selected perspective, posture and eye offset. The scene-level `exposure` object stores `ev` (−2 to +2) and the boolean `automatic`. It is independent of pose bookmarks and lighting presets. Share JSON adds reference metadata with the exact derived pose, numeric aspect ratio and `appliedExposureEV`. The readable scene summary reports the mode, slider setting and applied EV. Normal import restores the underlying scene. The app validates scene fields and collision for the independent camera before applying a snapshot. Scene previews are rendered on demand and remain outside browser storage.

## Daylight and fixtures

The east-facing kitchen receives its strongest direct contribution in the morning. The north-facing bedrooms receive mostly diffuse courtyard light, with a small grazing contribution early and late in the day. Weather reduces direct light more strongly than diffuse light, and drawn curtains attenuate both. A hemisphere light represents broad sky fill and floor bounce, with a brighter ground tint in snow. Window lights use finite falloff and the approximation omits wall occlusion and cast shadows.

The ambient floor stays low at night so individual fixtures retain their intensity and colour controls. Auto exposure uses the simulated time, weather, curtain state and distance to openings and active fixtures. It avoids brightening unlit nights. Camera exposure is applied in linear colour before sRGB output, so each stop doubles or halves the exposure multiplier before clipping.

## Development and deployment

Start a static HTTP server from the repository root, for example `python -m http.server 8000`, then open `http://localhost:8000/`. WebGL and the existing pinned Three.js CDN are required for rendering. Scene controls and JSON exchange remain available if rendering fails.

- `geometry.js` defines the retained floor plan and static furnishings.
- `render.js` builds the scene, manages dynamic props, and renders on demand. It batches static geometry and courtyard details by material and caps pixel ratio at 1.5 for mobile GPUs.
- `state.js` defines stable IDs, defaults, schema validation and migration.
- `app.js` handles collision, navigation, scene interaction and persistence.
- `studio.js` manages the sheet, authoring tools and portable share package.
- `index.html` and `style.css` define the Polish-language interface.

The existing GitHub Pages deployment serves the repository root. There is no build step or database. Open a pull request to review source changes before merging to the publication branch. See [AGENTS.md](AGENTS.md), [APARTMENT.md](APARTMENT.md), [ROADMAP.md](ROADMAP.md) and [CHANGELOG.md](CHANGELOG.md).

## Verification

Run the schema, daylight and exposure regression checks with `node --test tests/*.test.cjs`. For a browser smoke check, use a touch-enabled mobile viewport, change sheet positions with both the grip and buttons, and switch all interaction modes with a scene already composed. Exercise room lights, weather, direct object gestures, furniture history, character anchors and both POVs. Save and reload a named scene, test a schema 1 import, then download the PNG and JSON from a prepared share. Compare the same viewpoint in sunny and overcast daylight with the lamps off, close a curtain, then compare with night and a single lamp. Confirm the ±2 EV extremes, auto and reset in both camera perspectives, and check that the share PNG and reported EV match the prepared scene.

The release was exercised in Chromium with simulated mobile touch and software WebGL. Actual iPhone Safari layout and gestures, memory and WebGL context recovery, physical mobile GPU performance, and the iOS share sheet still require device verification.
