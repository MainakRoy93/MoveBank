import * as THREE from 'three';
import type { EarthLayerManifest } from '../registry/types';
import type { GlobeSceneContext, LayerRenderer } from './types';

interface RasterLayerOptions {
  radius?: number;
  segments?: number;
  color?: number;
}

export class RasterLayerRenderer implements LayerRenderer {
  id: string;
  private readonly assetId: string;
  private readonly opacity: number;
  private readonly options: RasterLayerOptions;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshBasicMaterial | null = null;
  private mesh: THREE.Mesh | null = null;

  constructor(layer: EarthLayerManifest) {
    const assetId = layer.assetIds[0];

    if (!assetId) {
      throw new Error(`Raster layer "${layer.id}" requires at least one texture asset.`);
    }

    this.id = layer.id;
    this.assetId = assetId;
    this.opacity = layer.opacity;
    this.options = layer.rendererOptions ?? {};
  }

  async mount(context: GlobeSceneContext) {
    const texture = await context.assetLoader.loadTexture(this.assetId, context.signal);

    if (context.signal.aborted) return;

    this.geometry = new THREE.SphereGeometry(
      this.options.radius ?? 5,
      this.options.segments ?? 128,
      this.options.segments ?? 128,
    );
    this.material = new THREE.MeshBasicMaterial({
      color: this.options.color ?? 0xffffff,
      map: texture,
      transparent: this.opacity < 1,
      opacity: this.opacity,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    context.scene.add(this.mesh);
  }

  setVisible(visible: boolean) {
    if (this.mesh) {
      this.mesh.visible = visible;
    }
  }

  setOpacity(opacity: number) {
    if (this.material) {
      this.material.transparent = opacity < 1;
      this.material.opacity = opacity;
      this.material.needsUpdate = true;
    }
  }

  dispose(context: GlobeSceneContext) {
    if (this.mesh) {
      context.scene.remove(this.mesh);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
