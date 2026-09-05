# Current-to-Target Migration Plan

This plan keeps the code runnable while the architecture becomes more explicit.

## Phase 1: Document Decisions

Status: current step.

- Add ADRs for stack, local manifests, declarative layers, and provenance.
- Document target repo structure without moving source files.
- Define the LayerManager boundary before implementing it.

## Phase 2: Stabilize Frontend Boundaries

- Implement `LayerManager` inside the current `src/globe` tree.
- Move ad hoc layer lifecycle out of `GlobeScene`.
- Keep `GlobeScene` responsible for scene setup, resize, render loop, and cleanup.
- Keep manifests under `src/globe/registry` until the config package or API boundary exists.

## Phase 3: Separate Engine and Config Concepts

- Extract renderer contracts, layer lifecycle types, coordinate service, and manifest types into clearer subdirectories.
- Migrate touched JavaScript renderers to TypeScript when the migration reduces ambiguity.
- Add schema validation for manifests before moving them into a shared package.

## Phase 4: Introduce Target Folders

Move to the target folder structure only after boundaries are stable:

- Move the root Vite app to `apps/web`.
- Move reusable globe code to `packages/earth-engine`.
- Move manifest types and schemas to `packages/earth-config`.
- Add `data` folders when real raw/processed assets and metadata are ready.

## Phase 5: Add Services and Pipeline

- Add `services/earth-api` when local manifests are no longer enough.
- Keep a local manifest fallback.
- Add `packages/asset-pipeline` when asset preparation needs repeatable scripts.

## Guardrails

- Do not move files just to match the target diagram.
- Move code when a boundary has a consumer or reduces real coupling.
- Keep the app buildable after every migration step.
- Preserve legacy renderers behind manifests until they are removed intentionally.
