# Architecture

This directory describes the planned Base Earth platform shape from `PRODUCT.md` and how the current repository will move toward it.

## Documents

- [Target Repository Structure](./target-repo-structure.md)
- [Current-to-Target Migration Plan](./migration-plan.md)
- [LayerManager Design](./layer-manager.md)
- [Milestone Map](./milestones.md)

## Current State

The app is currently a root-level React/Vite application. The first architecture slice introduced:

- `GlobeScene` as the React boundary for the Three.js scene lifecycle.
- Typed local manifests for Earth profiles, layers, assets, and attribution.
- `retro-earth` as the default profile.
- `minimal-earth-test` as a second profile to prove config-driven rendering.

The next code slice should implement LayerManager without moving the app or source tree yet.
