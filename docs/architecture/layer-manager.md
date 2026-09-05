# LayerManager Design

LayerManager is the next implementation boundary after the initial `GlobeScene` and local manifest work.

## Goal

LayerManager owns generic layer lifecycle. It should load layer manifests, create renderers, apply order and visibility, expose active layer state, and dispose layers cleanly.

It should not know the business meaning of a layer. It routes manifest data to renderers by layer type.

## Responsibilities

- Resolve the active profile's layer manifests.
- Sort layers by manifest `order`.
- Create renderers through the layer renderer registry/factory.
- Mount, unmount, and dispose layer renderers.
- Track layer status: idle, loading, mounted, hidden, error, disposed.
- Apply visibility and opacity state.
- Expose active layer state for future UI and attribution aggregation.
- Preserve abort/cleanup behavior during profile switches and React strict-mode remounts.

## Non-Responsibilities

- It does not create the Three.js scene, camera, renderer, controls, or animation loop.
- It does not decide which profile is active.
- It does not know about species, migration routes, MoveBank ingestion, BirdCast, eBird, or story journeys.
- It does not fetch live environmental or weather data.
- It does not render a layer directly; renderers do that.

## Proposed State Shape

```ts
type LayerLifecycleStatus =
  | 'idle'
  | 'loading'
  | 'mounted'
  | 'hidden'
  | 'error'
  | 'disposed';

interface ManagedLayerState {
  id: string;
  type: EarthLayerType;
  visible: boolean;
  opacity: number;
  order: number;
  status: LayerLifecycleStatus;
  error?: string;
  assetIds: string[];
  attributionIds: string[];
}
```

This is a planned contract. The implementation can refine names, but it should preserve the concepts.

## Proposed Lifecycle

1. `GlobeScene` resolves the active profile.
2. `GlobeScene` creates a LayerManager with the Three.js scene context.
3. LayerManager receives the profile's layer manifests.
4. LayerManager sorts visible layers by order.
5. LayerManager creates renderers through the layer factory.
6. LayerManager mounts renderers, tracks status, and reports errors.
7. On profile or quality changes, LayerManager disposes removed layers and mounts new layers.
8. On unmount, LayerManager aborts pending work and disposes all renderers.

## Renderer Contract

Renderers should expose the smallest lifecycle needed by LayerManager:

```ts
interface LayerRenderer {
  id?: string;
  mount?(context: GlobeSceneContext): unknown | Promise<unknown>;
  animate?(time: number | undefined, context: GlobeSceneContext): void;
  resize?(size: { width: number; height: number }, context: GlobeSceneContext): void;
  setVisible?(visible: boolean, context: GlobeSceneContext): void;
  setOpacity?(opacity: number, context: GlobeSceneContext): void;
  dispose?(context: GlobeSceneContext): void;
}
```

Existing JavaScript renderers can be adapted gradually. New renderers should implement this contract directly.

## Relationship to GlobeScene

`GlobeScene` should remain the scene container. It should own:

- Three.js scene creation.
- Renderer and camera setup.
- Controls and postprocessing.
- Resize handling.
- Render loop.
- Final cleanup.

LayerManager should own:

- Layer renderer creation.
- Layer lifecycle.
- Layer state.
- Layer visibility and opacity.

This keeps the scene boundary stable while making layer behavior generic.
