import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DomEvents } from '../utils/domEvents.js';

const defaultCamera = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 5, 6.7],
};

const defaultBloom = {
  threshold: 0.05,
  strength: 4,
  radius: 0.3,
};

export class GlobeController {
  constructor(container, config = {}) {
    this.container = container;
    this.config = config;
    this.layers = config.layers ?? [];
    this.animationFrameId = null;
    this.abortController = new AbortController();
    this.destroyed = false;

    this.scene = new THREE.Scene();
    this.camera = this.createCamera(config.camera);
    this.renderer = this.createRenderer();
    this.domEvents = new DomEvents(this.camera, this.renderer.domElement);
    this.controls = this.createControls(config.controls);
    this.composer = this.createComposer(config.postprocessing);

    this.context = {
      THREE,
      tween: TWEEN,
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      domEvents: this.domEvents,
      container: this.container,
      signal: this.abortController.signal,
    };
    this.debug = {
      layers: {},
    };
    this.context.debug = this.debug;
    this.container.__globeController = this;
    window.__moveBankGlobe = this;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
  }

  mount() {
    this.layerMounts = this.layers.map((layer) => {
      const mountResult = layer.mount?.(this.context);

      return Promise.resolve(mountResult).catch((error) => {
        if (!this.destroyed && error.name !== 'AbortError') {
          if (layer.id) {
            this.debug.layers[layer.id] = {
              status: 'error',
              message: error.message,
            };
          }
          console.error(`Failed to mount globe layer${layer.id ? ` "${layer.id}"` : ''}.`, error);
        }
      });
    });
    window.addEventListener('resize', this.resize);
    this.animate();
    return () => this.destroy();
  }

  createCamera(cameraConfig = {}) {
    const settings = { ...defaultCamera, ...cameraConfig };
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(settings.fov, width / height, settings.near, settings.far);

    camera.layers.enable(1);
    camera.position.set(...settings.position);
    return camera;
  }

  createRenderer() {
    const renderer = new THREE.WebGL1Renderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  createControls(controlConfig = {}) {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.minDistance = controlConfig.minDistance;
    controls.maxDistance = controlConfig.maxDistance;
    controls.zoomSpeed = controlConfig.zoomSpeed;
    controls.panSpeed = controlConfig.panSpeed;
    return controls;
  }

  createComposer(postprocessing = {}) {
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

    this.bloomPass = bloomPass;
    return composer;
  }

  getSize() {
    return {
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || window.innerHeight,
    };
  }

  resize() {
    const { width, height } = this.getSize();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
    this.layers.forEach((layer) => layer.resize?.({ width, height }, this.context));
  }

  animate(time) {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.renderer.autoClear = false;
    this.renderer.clear();

    this.camera.layers.set(1);
    this.composer.render();

    this.renderer.clearDepth();
    this.camera.layers.set(0);

    this.layers.forEach((layer) => layer.animate?.(time, this.context));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    TWEEN.update();
  }

  destroy() {
    this.destroyed = true;
    this.abortController.abort();
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.animationFrameId);
    TWEEN.removeAll();
    this.layers.forEach((layer) => layer.dispose?.(this.context));
    this.domEvents.destroy();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    delete this.container.__globeController;
    if (window.__moveBankGlobe === this) {
      delete window.__moveBankGlobe;
    }
  }
}
