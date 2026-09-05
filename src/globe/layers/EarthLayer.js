import * as THREE from 'three';
import atmosphereVertexShader from '../../shaders/vertex/atmosphereVertex.glsl?raw';
import atmosphereFragmentShader from '../../shaders/fragment/atmosphereFragment.glsl?raw';

export class EarthLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'earth-surface';
    this.radius = options.radius ?? 5;
    this.segments = options.segments ?? 250;
    this.color = options.color ?? 0x000000;
    this.opacity = options.opacity ?? 1;
    this.atmosphereScale = options.atmosphereScale ?? 1.4;
    this.atmosphereVisible = options.atmosphereVisible ?? true;
    this.ambientLightColor = options.ambientLightColor ?? 0xffffff;
    this.ambientLightIntensity = options.ambientLightIntensity ?? 1;
    this.objects = [];
  }

  mount({ scene }) {
    this.earthMaterial = new THREE.MeshPhysicalMaterial({
      color: this.color,
      transparent: this.opacity < 1,
      opacity: this.opacity,
    });
    this.earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, this.segments, this.segments),
      this.earthMaterial,
    );

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, this.segments, this.segments),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    );
    this.atmosphere.scale.set(this.atmosphereScale, this.atmosphereScale, this.atmosphereScale);
    this.atmosphere.visible = this.atmosphereVisible;

    this.ambientLight = new THREE.AmbientLight(this.ambientLightColor, this.ambientLightIntensity);

    this.objects = [this.earthMesh, this.atmosphere, this.ambientLight];
    scene.add(...this.objects);
  }

  dispose({ scene }) {
    this.objects.forEach((object) => scene.remove(object));
    this.earthMesh?.geometry.dispose();
    this.earthMaterial?.dispose();
    this.atmosphere?.geometry.dispose();
    this.atmosphere?.material.dispose();
  }
}
