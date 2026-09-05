# Milestone Map

This map connects `PRODUCT.md` milestones to the current repository state.

## Milestone 1: Static Earth Renderer

Status: partially complete.

- `GlobeScene` owns the scene lifecycle.
- The app renders a dark retro Earth profile.
- Orbit controls, postprocessing, resize, and cleanup are in place.
- A visible attribution panel is not implemented yet.

## Milestone 2: Config-Driven Earth Profile

Status: in progress.

- Typed local profile, layer, asset, and attribution manifests exist.
- `retro-earth` is the default profile.
- `minimal-earth-test` proves profile switching can change visual identity.
- Renderer creation is driven by layer type.
- Local manifests still need validation and attribution aggregation.

## Milestone 3: Layer Manager

Status: next code implementation.

Planned deliverables:

- LayerManager module.
- Layer lifecycle state.
- Generic visibility and opacity controls.
- Cleaner profile/quality switching.
- Layer state available for future UI and attribution display.

The first LayerManager slice should not include a layer panel UI yet unless required for validation.

## Milestone 4: Day/Night System

Status: not started.

Planned after LayerManager:

- TimeController.
- Sun direction boundary.
- Night-light and terminator behavior.
- Manual and real-time modes.

## Milestone 5: Vector Reference Geography

Status: not started.

Requires LayerManager and vector renderer boundaries before adding coastlines, borders, rivers, or lakes.

## Milestone 6: Earth Registry API

Status: deferred.

Local manifests intentionally precede the API. When the API is added, it should serve the same profile, layer, asset, and attribution concepts already used by the frontend.

## Milestone 7: Asset Pipeline Skeleton

Status: deferred.

The target structure is documented, but raw and processed asset folders should be added only when real assets or README placeholders are ready.

## Milestone 8: Earth Profile Switching

Status: early proof exists.

The `?profile=minimal-earth-test` URL proves the renderer can switch profile input. A user-facing profile switcher and polished profile set are future work.
