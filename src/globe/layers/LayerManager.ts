import { createLayerRenderer } from './createLayerRenderer';
import type { EarthLayerManifest } from '../registry/types';
import type {
  GlobeSceneContext,
  LayerRenderer,
  LayerRendererFactory,
  ManagedLayerState,
} from './types';

interface ManagedLayer {
  manifest: EarthLayerManifest;
  renderer: LayerRenderer | null;
  state: ManagedLayerState;
}

export interface LayerManagerOptions {
  context: GlobeSceneContext;
  layers: EarthLayerManifest[];
  createRenderer?: LayerRendererFactory;
  onError?: (error: Error, layer: ManagedLayerState) => void;
}

export class LayerManager {
  private readonly context: GlobeSceneContext;
  private readonly createRenderer: LayerRendererFactory;
  private readonly onError?: (error: Error, layer: ManagedLayerState) => void;
  private readonly layers = new Map<string, ManagedLayer>();
  private disposed = false;

  constructor({
    context,
    layers,
    createRenderer = createLayerRenderer,
    onError,
  }: LayerManagerOptions) {
    this.context = context;
    this.createRenderer = createRenderer;
    this.onError = onError;

    [...layers]
      .sort((a, b) => a.order - b.order)
      .forEach((layer) => {
        this.layers.set(layer.id, {
          manifest: layer,
          renderer: null,
          state: this.createInitialState(layer),
        });
      });

    this.syncDebugState();
  }

  async mount() {
    const mounts = [...this.layers.values()].map((layer) => this.mountLayer(layer));
    await Promise.allSettled(mounts);
  }

  animate(time?: number) {
    if (this.disposed) return;

    this.layers.forEach((layer) => {
      if (layer.state.status === 'mounted' && layer.state.visible) {
        layer.renderer?.animate?.(time, this.context);
      }
    });
  }

  resize(size: { width: number; height: number }) {
    if (this.disposed) return;

    this.layers.forEach((layer) => {
      if (layer.state.status === 'mounted') {
        layer.renderer?.resize?.(size, this.context);
      }
    });
  }

  setLayerVisible(layerId: string, visible: boolean) {
    const layer = this.getManagedLayer(layerId);
    layer.state.visible = visible;
    layer.state.status = visible ? 'mounted' : 'hidden';
    layer.renderer?.setVisible?.(visible, this.context);
    this.syncDebugState();
  }

  setLayerOpacity(layerId: string, opacity: number) {
    const layer = this.getManagedLayer(layerId);
    layer.state.opacity = opacity;
    layer.renderer?.setOpacity?.(opacity, this.context);
    this.syncDebugState();
  }

  getLayerStates() {
    return [...this.layers.values()].map((layer) => ({ ...layer.state }));
  }

  dispose() {
    if (this.disposed) return;

    this.disposed = true;
    this.layers.forEach((layer) => {
      try {
        layer.renderer?.dispose?.(this.context);
      } finally {
        layer.state.status = 'disposed';
      }
    });
    this.syncDebugState();
  }

  private async mountLayer(layer: ManagedLayer) {
    if (this.disposed || this.context.signal.aborted) return;

    if (!layer.state.visible) {
      layer.state.status = 'hidden';
      this.syncDebugState();
      return;
    }

    layer.state.status = 'loading';
    this.syncDebugState();

    try {
      layer.renderer = this.createRenderer(layer.manifest);
      await layer.renderer.mount?.(this.context);

      if (this.disposed || this.context.signal.aborted) return;

      layer.state.status = layer.state.visible ? 'mounted' : 'hidden';
      delete layer.state.error;
      this.syncDebugState();
    } catch (error) {
      if (this.disposed || this.context.signal.aborted) return;

      const normalizedError = error instanceof Error ? error : new Error(String(error));
      layer.state.status = 'error';
      layer.state.error = normalizedError.message;
      this.syncDebugState();
      this.onError?.(normalizedError, { ...layer.state });
      console.error(`Failed to mount globe layer "${layer.manifest.id}".`, normalizedError);
    }
  }

  private createInitialState(layer: EarthLayerManifest): ManagedLayerState {
    return {
      id: layer.id,
      type: layer.type,
      visible: layer.defaultVisible,
      opacity: layer.opacity,
      order: layer.order,
      status: layer.defaultVisible ? 'idle' : 'hidden',
      assetIds: [...layer.assetIds],
      attributionIds: [...layer.attributionIds],
    };
  }

  private getManagedLayer(layerId: string) {
    const layer = this.layers.get(layerId);

    if (!layer) {
      throw new Error(`Unknown managed layer "${layerId}".`);
    }

    return layer;
  }

  private syncDebugState() {
    this.context.debug.layerManager = Object.fromEntries(
      this.getLayerStates().map((state) => [state.id, state]),
    );
  }
}
