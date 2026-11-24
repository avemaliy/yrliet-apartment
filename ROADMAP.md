# Roadmap

## Implemented in v1.0

- Existing floor plan and room presets, movement, plan navigation, doors, sofa bed and PNG export.
- Twelve independent lamps with power, intensity and color temperature. Day cycle, window light, lighting presets and a shared courtyard.
- Procedural surface treatments, contact shading, additional furnishings and opening window sashes, movable curtains and TV power.
- Portrait, landscape and square camera frames, posture shortcuts, exact JSON camera parameters, grid, saved views and full-viewport photography.
- Allowlisted furniture adjustments and collision checks. Versioned scene files, automatic browser saves, named slots and a copyable composition summary.

## Planned checks and refinements

- Verify actual iPhone Safari interactions, memory, context recovery and PNG export.
- Assess frame timing on older mobile GPUs before expanding decorative assets or enabling any higher-quality path.
- Refine material scale and daylight color from in-browser review.

## Technical limitations

Lighting uses window-local fills and static contact gradients. Dynamic shadow maps, reflections, accurate exposure and full physical light transport are deferred to keep the mobile baseline light. The television uses a procedural emissive image. Opening each window moves one sash. Camera movement uses planar collision, with an explicit exception for the sofa viewpoint. Scene files are portable, while named slots and automatic saving are browser-local. Three.js still loads from the pinned CDN.
