# MoveBank

React/Vite/TypeScript app for the MoveBank Base Earth platform.

The project is moving from a one-off migration globe toward a configurable, source-aware Earth renderer described in [PRODUCT.md](./PRODUCT.md).

## Scripts

- `npm run dev` starts the local Vite dev server.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.

## Architecture Docs

- [Architecture overview](./docs/architecture/README.md)
- [Target repository structure](./docs/architecture/target-repo-structure.md)
- [Current-to-target migration plan](./docs/architecture/migration-plan.md)
- [LayerManager design](./docs/architecture/layer-manager.md)
- [Milestone map](./docs/architecture/milestones.md)
- [Architecture Decision Records](./docs/adr/README.md)

## Globe Architecture

- `src/globe/GlobeScene.tsx` is the current React boundary for the Three.js scene lifecycle.
- `src/globe/registry/` contains typed local manifests for Earth profiles, layers, assets, and attribution.
- `src/globe/layers/createLayerRenderer.ts` maps declarative layer types to renderer implementations.
- `src/globe/layers/` contains current renderer implementations, including legacy point, arc, and location-ring layers.
- `src/globe/GlobeController.js`, `src/globe/createMoveBankGlobe.js`, and `src/globe/config/moveBankGlobeConfig.js` are legacy-compatible paths and should not be treated as the primary architecture boundary for new work.
- Large layer datasets are served from `public/globe-assets/` and loaded by layers at runtime instead of being bundled into the app JavaScript.

## Current Profiles

- `retro-earth` is the default profile and preserves the current dark point-cloud Earth look.
- `minimal-earth-test` is a second profile used to verify that profile manifests can change the rendered Earth identity.
- `natural-earth-test` verifies manifest-driven raster texture loading.

## Developer Layer URLs

The app supports query parameters for exercising layer selection without building UI yet:

- `?profile=natural-earth-test` switches profile.
- `?layers=retro-surface,retro-points` explicitly selects visible layers.
- `?hide=retro-points` hides selected/default layers.
- `?opacity=retro-points:0.25` applies manifest-time opacity overrides.

## Next Implementation Step

The next code slice should continue from the `LayerManager` boundary described in [docs/architecture/layer-manager.md](./docs/architecture/layer-manager.md).
