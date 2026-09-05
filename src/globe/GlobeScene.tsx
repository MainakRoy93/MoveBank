import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DomEvents } from '../utils/domEvents.js';
import { AssetLoader } from './assets/AssetLoader';
import { LayerManager } from './layers/LayerManager';
import { resolveEarthProfile, type ResolvedEarthProfile } from './registry/resolveProfile';
import type { GlobeSceneContext, ManagedLayerState } from './layers/types';
import type {
  CameraConfig,
  ControlConfig,
  EarthProfile,
  EarthQuality,
  LayerSelectionOverrides,
  PostprocessingConfig,
} from './registry/types';

type DomEventsInstance = InstanceType<typeof DomEvents>;

const defaultCamera = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 5, 6.7] as [number, number, number],
};

const defaultBloom = {
  threshold: 0.05,
  strength: 4,
  radius: 0.3,
};

export interface GlobeSceneHandle {
  profile: EarthProfile;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGL1Renderer;
  layerStates: ManagedLayerState[];
}

export interface GlobeSceneProps {
  profileId?: string;
  quality?: EarthQuality;
  layerOverrides?: LayerSelectionOverrides;
  className?: string;
  onReady?: (handle: GlobeSceneHandle) => void;
  onError?: (error: Error) => void;
  onLayerStatesChange?: (layers: ManagedLayerState[]) => void;
}

type GlobeContainer = HTMLElement & {
  __globeController?: GlobeSceneController;
};

type GlobeWindow = Window & {
  __moveBankGlobe?: GlobeSceneController;
};

class GlobeSceneController {
  private animationFrameId: number | null = null;
  private abortController = new AbortController();
  private destroyed = false;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGL1Renderer;
  private domEvents: DomEventsInstance;
  private assetLoader: AssetLoader;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private context: GlobeSceneContext;
  private layerManager: LayerManager;
  private debug: GlobeSceneContext['debug'];

  constructor(
    private container: GlobeContainer,
    private resolvedProfile: ResolvedEarthProfile,
    private onError?: (error: Error) => void,
    private onLayerStatesChange?: (layers: ManagedLayerState[]) => void,
  ) {
    this.camera = this.createCamera(resolvedProfile.profile.defaultCamera);
    this.renderer = this.createRenderer();
    this.domEvents = new DomEvents(this.camera, this.renderer.domElement);
    this.assetLoader = new AssetLoader();
    this.controls = this.createControls(resolvedProfile.profile.controls);
    const composerParts = this.createComposer(resolvedProfile.profile.postprocessing);
    this.composer = composerParts.composer;
    this.bloomPass = composerParts.bloomPass;
    this.debug = {
      profileId: resolvedProfile.profile.id,
      layers: {},
      layerManager: {},
    };

    this.context = {
      THREE,
      tween: TWEEN,
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      assetLoader: this.assetLoader,
      domEvents: this.domEvents,
      container: this.container,
      signal: this.abortController.signal,
      debug: this.debug,
    };
    this.layerManager = new LayerManager({
      context: this.context,
      layers: resolvedProfile.layers,
      onError: (error) => this.onError?.(error),
      onStateChange: (layers) => {
        if (!this.destroyed) {
          this.onLayerStatesChange?.(layers);
        }
      },
    });

    this.container.__globeController = this;
    (window as GlobeWindow).__moveBankGlobe = this;
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
  }

  mount(onReady?: (handle: GlobeSceneHandle) => void) {
    window.addEventListener('resize', this.resize);
    this.animate();

    this.layerManager.mount().then(() => {
      if (this.destroyed) return;
      onReady?.({
        profile: this.resolvedProfile.profile,
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
        layerStates: this.layerManager.getLayerStates(),
      });
    });

    return () => this.destroy();
  }

  private createCamera(cameraConfig: CameraConfig = {}) {
    const settings = { ...defaultCamera, ...cameraConfig };
    const { width, height } = this.getSize();
    const camera = new THREE.PerspectiveCamera(
      settings.fov,
      width / height,
      settings.near,
      settings.far,
    );

    camera.layers.enable(1);
    camera.position.set(...settings.position);
    return camera;
  }

  private createRenderer() {
    const renderer = new THREE.WebGL1Renderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(controlConfig: ControlConfig = {}) {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    if (controlConfig.minDistance !== undefined) controls.minDistance = controlConfig.minDistance;
    if (controlConfig.maxDistance !== undefined) controls.maxDistance = controlConfig.maxDistance;
    if (controlConfig.zoomSpeed !== undefined) controls.zoomSpeed = controlConfig.zoomSpeed;
    if (controlConfig.panSpeed !== undefined) controls.panSpeed = controlConfig.panSpeed;

    return controls;
  }

  private createComposer(postprocessing: PostprocessingConfig = {}) {
    const bloomConfig = { ...defaultBloom, ...(postprocessing.bloom ?? {}) };
    const size = this.getSize();
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      1.5,
      0.4,
      0.85,
    );

    bloomPass.threshold = bloomConfig.threshold;
    bloomPass.strength = bloomConfig.strength;
    bloomPass.radius = bloomConfig.radius;
    bloomPass.renderToScreen = true;

    const composer = new EffectComposer(this.renderer);
    composer.setSize(size.width, size.height);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    return { composer, bloomPass };
  }

  private getSize() {
    return {
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || window.innerHeight,
    };
  }

  private resize() {
    const { width, height } = this.getSize();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
    this.layerManager.resize({ width, height });
  }

  private animate(time?: number) {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.renderer.autoClear = false;
    this.renderer.clear();

    this.camera.layers.set(1);
    this.composer.render();

    this.renderer.clearDepth();
    this.camera.layers.set(0);

    this.layerManager.animate(time);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    TWEEN.update();
  }

  private destroy() {
    this.destroyed = true;
    this.abortController.abort();
    window.removeEventListener('resize', this.resize);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    TWEEN.removeAll();
    this.layerManager.dispose();
    this.assetLoader.dispose();
    this.domEvents.destroy();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    delete this.container.__globeController;
    if ((window as GlobeWindow).__moveBankGlobe === this) {
      delete (window as GlobeWindow).__moveBankGlobe;
    }
  }
}

export function GlobeScene({
  profileId = 'retro-earth',
  quality = 'medium',
  layerOverrides = {},
  className = 'globeViewport',
  onReady,
  onError,
  onLayerStatesChange,
}: GlobeSceneProps) {
  const globeRef = useRef<HTMLElement | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onLayerStatesChangeRef = useRef(onLayerStatesChange);

  onReadyRef.current = onReady;
  onErrorRef.current = onError;
  onLayerStatesChangeRef.current = onLayerStatesChange;

  useEffect(() => {
    if (!globeRef.current) return undefined;

    let resolvedProfile: ResolvedEarthProfile;

    try {
      resolvedProfile = resolveEarthProfile(profileId, quality, layerOverrides);
    } catch (error) {
      onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }

    const controller = new GlobeSceneController(
      globeRef.current,
      resolvedProfile,
      (error) => onErrorRef.current?.(error),
      (layers) => onLayerStatesChangeRef.current?.(layers),
    );

    return controller.mount((handle) => onReadyRef.current?.(handle));
  }, [profileId, quality, layerOverrides]);

  return <main ref={globeRef} className={className} aria-label={`${profileId} globe scene`} />;
}
