import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DomEvents } from '../utils/domEvents.js';
import { createLayerRenderer, type LayerRenderer } from './layers/createLayerRenderer';
import { resolveEarthProfile, type ResolvedEarthProfile } from './registry/resolveProfile';
import type {
  CameraConfig,
  ControlConfig,
  EarthProfile,
  EarthQuality,
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
}

export interface GlobeSceneProps {
  profileId?: string;
  quality?: EarthQuality;
  className?: string;
  onReady?: (handle: GlobeSceneHandle) => void;
  onError?: (error: Error) => void;
}

interface GlobeSceneContext {
  THREE: typeof THREE;
  tween: typeof TWEEN;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGL1Renderer;
  domEvents: DomEventsInstance;
  container: HTMLElement;
  signal: AbortSignal;
  debug: {
    profileId: string;
    layers: Record<string, unknown>;
  };
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
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private context: GlobeSceneContext;
  private layerRenderers: LayerRenderer[];
  private debug: GlobeSceneContext['debug'];

  constructor(
    private container: GlobeContainer,
    private resolvedProfile: ResolvedEarthProfile,
  ) {
    this.camera = this.createCamera(resolvedProfile.profile.defaultCamera);
    this.renderer = this.createRenderer();
    this.domEvents = new DomEvents(this.camera, this.renderer.domElement);
    this.controls = this.createControls(resolvedProfile.profile.controls);
    const composerParts = this.createComposer(resolvedProfile.profile.postprocessing);
    this.composer = composerParts.composer;
    this.bloomPass = composerParts.bloomPass;
    this.layerRenderers = resolvedProfile.layers.map(createLayerRenderer);
    this.debug = {
      profileId: resolvedProfile.profile.id,
      layers: {},
    };

    this.context = {
      THREE,
      tween: TWEEN,
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      domEvents: this.domEvents,
      container: this.container,
      signal: this.abortController.signal,
      debug: this.debug,
    };

    this.container.__globeController = this;
    (window as GlobeWindow).__moveBankGlobe = this;
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
  }

  mount(onReady?: (handle: GlobeSceneHandle) => void, onError?: (error: Error) => void) {
    window.addEventListener('resize', this.resize);
    this.animate();

    const layerMounts = this.layerRenderers.map((layer) => {
      const mountResult = layer.mount?.(this.context);

      return Promise.resolve(mountResult).catch((error: Error) => {
        if (!this.destroyed && error.name !== 'AbortError') {
          if (layer.id) {
            this.debug.layers[layer.id] = {
              status: 'error',
              message: error.message,
            };
          }
          console.error(`Failed to mount globe layer${layer.id ? ` "${layer.id}"` : ''}.`, error);
          onError?.(error);
        }
      });
    });

    Promise.allSettled(layerMounts).then(() => {
      if (this.destroyed) return;
      onReady?.({
        profile: this.resolvedProfile.profile,
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
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
    this.layerRenderers.forEach((layer) => layer.resize?.({ width, height }, this.context));
  }

  private animate(time?: number) {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.renderer.autoClear = false;
    this.renderer.clear();

    this.camera.layers.set(1);
    this.composer.render();

    this.renderer.clearDepth();
    this.camera.layers.set(0);

    this.layerRenderers.forEach((layer) => layer.animate?.(time, this.context));
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
    this.layerRenderers.forEach((layer) => layer.dispose?.(this.context));
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
  className = 'globeViewport',
  onReady,
  onError,
}: GlobeSceneProps) {
  const globeRef = useRef<HTMLElement | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!globeRef.current) return undefined;

    let resolvedProfile: ResolvedEarthProfile;

    try {
      resolvedProfile = resolveEarthProfile(profileId, quality);
    } catch (error) {
      onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }

    const controller = new GlobeSceneController(globeRef.current, resolvedProfile);

    return controller.mount(
      (handle) => onReadyRef.current?.(handle),
      (error) => onErrorRef.current?.(error),
    );
  }, [profileId, quality]);

  return <main ref={globeRef} className={className} aria-label={`${profileId} globe scene`} />;
}
