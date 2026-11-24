# Changelog

## 1.1.1 — Daylight and exposure

- Strengthened local window daylight using façade orientation, time, weather and curtains, with a broad sky fill and floor bounce approximation.
- Added manual and automatic camera exposure, including reset, scene persistence, reference text and PNG output.
- Existing scenes load at manual 0 EV.

## 1.1.0 — Scene Studio

- Introduced a full-viewport mobile studio with accessible three-position controls and three interaction modes.
- Added viewport taps and long presses for household objects, plus furniture selection highlighting and undo/redo.
- Added fictional weather, scene dates, custom lighting presets, and camera-room prioritization.
- Added poseable character proxies, furniture anchors, independent head and gaze controls, and character POVs.
- Added scene rename, duplicate and update actions and a share package with clean PNG, schema 2 JSON and a copyable scene reference.
- Migrated schema 1 snapshots using the existing local storage key.
- Grouped lighting controls into collapsible room sections with room-wide switches and locally remembered expansion. Individual controls and presets remain available.

## 1.0.0

- Retained the v0.5 coordinates, exterior openings and original navigation and interaction features.
- Added the six intended v0.6 fixtures with separate switches, intensity sliders and temperature sliders.
- Added three window and curtain controls, television power, a shared courtyard, time-of-day transitions, updated surface finishes and furnishing details.
- Added camera posture presets, framing, a composition grid, bookmarks, full-viewport mode and reproducible camera metadata.
- Added editing for rugs, dining chairs and the table vase. Added local autosave, scene slots, validated JSON exchange, a legacy save migration and copyable scene summaries.
- Split the static app into geometry, rendering, state, controls and styles. Established persistent technical documentation.

## 0.6 (design)

Specified six additional independently controllable lights. Developed separately and never deployed to GitHub Pages.

## 0.5

Static Three.js apartment with room presets, drag and keyboard navigation, a clickable floor plan, day-cycle lighting, six independent lamps, doors, convertible sofa, local save and PNG export.
