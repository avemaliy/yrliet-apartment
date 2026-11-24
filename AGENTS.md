# Development instructions

Yrliet Apartment is a persistent 3D spatial reference for storytelling, interior design and photographic composition. ChatGPT handles creative direction and design. Codex implements and verifies software changes.

- Preserve the v0.5 plan, structural openings, and metre-scale coordinates. Obtain explicit approval for layout changes. Use geometry.js as the implemented source and record discrepancies with the brief in APARTMENT.md.
- Prioritize reliable mobile Safari behavior, spatial consistency, reproducible camera views, local persistence and then visual realism.
- Keep GitHub Pages and the build-free static entry point. Avoid backends, paid services, and new dependencies unless required and agreed.
- Keep static geometry, renderer, versioned state and DOM controls separate. Add furniture editing only through explicit allowlisted IDs. Update rendering and collision together when a moving object affects navigation.
- Preserve stable scene identifiers and units. Document migration when changing the schema. Reject invalid imports before applying them.
- Update the relevant project documentation after every substantial change. Exclude private conversations, personal information and actual residential addresses from the public repository.
- Work on a branch, verify the relevant behavior, and open a pull request with architectural decisions, checks and limitations. Verify syntax, scene round trips, persistence, camera and collision. Check browser rendering and iPhone Safari where available.
