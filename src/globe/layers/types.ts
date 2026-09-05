import type * as THREE from 'three';
import type * as TWEEN from '@tweenjs/tween.js';
import type { AssetLoader } from '../assets/AssetLoader';
import type { EarthLayerManifest, EarthLayerType } from '../registry/types';

export type LayerLifecycleStatus =
  | 'idle'
  | 'loading'
  | 'mounted'
  | 'hidden'
  | 'error'
  | 'disposed';

export interface ManagedLayerState {
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

export interface GlobeSceneDebug {
  profileId: string;
  layers: Record<string, unknown>;
  layerManager: Record<string, ManagedLayerState>;
}

export interface GlobeSceneContext {
  THREE: typeof THREE;
  tween: typeof TWEEN;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGL1Renderer;
  assetLoader: AssetLoader;
  domEvents: unknown;
  container: HTMLElement;
  signal: AbortSignal;
  debug: GlobeSceneDebug;
}

export interface LayerRenderer {
  id?: string;
  mount?: (context: GlobeSceneContext) => unknown | Promise<unknown>;
  animate?: (time: number | undefined, context: GlobeSceneContext) => void;
  resize?: (size: { width: number; height: number }, context: GlobeSceneContext) => void;
  setVisible?: (visible: boolean, context: GlobeSceneContext) => void;
  setOpacity?: (opacity: number, context: GlobeSceneContext) => void;
  setColor?: (color: string, context: GlobeSceneContext) => void;
  dispose?: (context: GlobeSceneContext) => void;
}

export type LayerRendererFactory = (layer: EarthLayerManifest) => LayerRenderer;
