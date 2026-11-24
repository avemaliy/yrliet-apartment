# Yrliet Apartment

A browser-based 3D apartment in Kraków for visual continuity, interiors and photographic reference. [Open the GitHub Pages app](https://avemaliy.github.io/yrliet-apartment/).

## Use

- Drag the view to look around. Use the movement buttons, WASD or arrow keys to walk. The plan and room buttons jump to a viewpoint.
- Use **Światło** for time and fixtures. Lighting presets change the time and which fixtures are switched on. They retain each fixture’s intensity and temperature.
- Use **Drzwi, okna i wyposażenie** to operate doors, windows, curtains, sofa bed and TV.
- In **Aparat i kompozycja**, set eye height, vertical field of view and crop. Save camera bookmarks or turn on the composition grid. **Tryb zdjęcia** fills the browser viewport. Tap the canvas to show or hide the photography buttons. PNG records the rendered frame with no interface or grid.
- In **Ustawienie mebli**, select a rug, dining chair or vase. Move in 10 cm steps, rotate in 15° steps, or reset the item. Chairs stay in the kitchen, the vase stays on the table, and rugs stay in their rooms.
- **Zapis i wymiana scen** can save up to 40 named snapshots, import or export the active scene, reset the active scene, and copy a readable summary. The current scene autosaves locally. Export JSON to transfer a scene to another device or share it with a screenshot.

## Scene format

Schema version 1 uses a readable JSON object. `appVersion` identifies the producer and `schemaVersion` identifies the file structure. The current app emits `1.0.0`. Camera plan coordinates and height are in metres. Yaw and pitch are in radians, with yaw zero facing north, increasing clockwise. Positive pitch looks up. `verticalFov` is in degrees. Framing is `landscape` (4:3), `portrait` (3:4) or `square` (1:1).

`timeOfDay` is hours on a 24-hour clock. Lights store on/off, a multiplier (0–2) and kelvin by fixture ID. Doors and windows store open booleans. Curtain booleans are true when drawn across the window. Modified furniture stores absolute x/y in metres, plus Three.js y-axis rotation in radians. `seatedOnSofa` marks the explicit sofa collision exception. Scene data includes the sofa, TV and camera bookmarks. All coordinates are independent of the device's screen size.

The app validates schema, ranges, IDs and physical positions before applying an import. Legacy v0.5 saves are migrated, with an approximate vertical FOV based on the current viewport and an adjacent free position when a new collider occupies the original position. The old browser storage entry is left available during migration.

## Development and deployment

Start a static HTTP server from the repository root, for example `python -m http.server 8000`, then open `http://localhost:8000/`. WebGL and the existing pinned Three.js CDN are required for rendering. Scene controls and JSON exchange remain available if rendering fails.

- `geometry.js` defines the retained floor plan and static furnishings.
- `render.js` builds the scene, manages dynamic props, and renders on demand. It batches static geometry and courtyard details by material and caps pixel ratio at 1.5 for mobile GPUs.
- `state.js` defines stable IDs, defaults, schema validation and migration.
- `app.js` handles collision, camera controls, layout, editor and persistence.
- `index.html` and `style.css` define the Polish-language interface.

The existing GitHub Pages deployment serves the repository root. There is no build step or database. Open a pull request to review source changes before merging to the publication branch. See [AGENTS.md](AGENTS.md), [APARTMENT.md](APARTMENT.md), [ROADMAP.md](ROADMAP.md) and [CHANGELOG.md](CHANGELOG.md).
