import * as THREE from 'three';
import { assets } from '../registry/manifests';
import type { EarthAsset } from '../registry/types';

export interface AssetLoaderOptions {
  assetRegistry?: Record<string, EarthAsset>;
}

export class AssetLoader {
  private readonly assetRegistry: Record<string, EarthAsset>;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly texturePromises = new Map<string, Promise<THREE.Texture>>();
  private readonly textures = new Set<THREE.Texture>();

  constructor({ assetRegistry = assets }: AssetLoaderOptions = {}) {
    this.assetRegistry = assetRegistry;
  }

  loadTexture(assetId: string, signal?: AbortSignal) {
    if (this.texturePromises.has(assetId)) {
      return this.texturePromises.get(assetId) as Promise<THREE.Texture>;
    }

    const asset = this.assetRegistry[assetId];

    if (!asset) {
      throw new Error(`Unknown Earth asset "${assetId}".`);
    }

    const promise = this.loadTextureAsset(asset, signal);
    this.texturePromises.set(assetId, promise);

    return promise;
  }

  dispose() {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.texturePromises.clear();
  }

  private async loadTextureAsset(asset: EarthAsset, signal?: AbortSignal) {
    const primaryUrl = asset.url;

    if (!primaryUrl) {
      throw new Error(`Earth asset "${asset.id}" does not define a texture URL.`);
    }

    try {
      return await this.loadTextureUrl(primaryUrl, signal);
    } catch (error) {
      if (!asset.fallbackUrl) throw error;
      return this.loadTextureUrl(asset.fallbackUrl, signal);
    }
  }

  private loadTextureUrl(url: string, signal?: AbortSignal) {
    return new Promise<THREE.Texture>((resolve, reject) => {
      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      const abort = () => reject(createAbortError());
      signal?.addEventListener('abort', abort, { once: true });

      this.textureLoader.load(
        url,
        (texture) => {
          signal?.removeEventListener('abort', abort);
          if (signal?.aborted) {
            texture.dispose();
            reject(createAbortError());
            return;
          }

          texture.encoding = THREE.sRGBEncoding;
          texture.anisotropy = 4;
          this.textures.add(texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          signal?.removeEventListener('abort', abort);
          reject(error instanceof Error ? error : new Error(`Failed to load texture "${url}".`));
        },
      );
    });
  }
}

function createAbortError() {
  return new DOMException('Asset load aborted.', 'AbortError');
}
