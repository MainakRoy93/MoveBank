# ADR 0004: Declarative Layer Rendering

Status: Accepted
Date: 2026-06-28

## Context

The project principle is: make layers declarative, make rendering generic, make provenance mandatory.

The current `GlobeScene` resolves an Earth profile into layer manifests, then creates renderers by layer `type`. This is the first step toward the LayerManager described in `PRODUCT.md`.

## Decision

Profiles and layer manifests decide which layers exist, their visibility, order, opacity, assets, and attribution.

Rendering code may know how to render a layer type, but it must not know the business meaning of a specific profile. Layer renderer lookup happens through a registry/factory keyed by layer `type`.

## Consequences

- Adding a new profile should mainly be manifest work.
- Adding a new layer type requires a renderer and a factory registration.
- `GlobeScene` should become thinner as LayerManager takes over layer lifecycle.
- Legacy MoveBank-specific renderers can remain available, but they should be hidden behind manifests and disabled by default unless a profile selects them.
