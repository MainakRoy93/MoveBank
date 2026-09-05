import * as THREE from 'three';
import { loadJson } from '../data/loadJson.js';

export class PointLayer {
  id = 'surface-points';

  constructor({ id = 'surface-points', points, source, radius = 0.008, segments = 5, color = 3818644, opacity = 1 }) {
    this.id = id;
    this.points = points;
    this.source = source;
    this.radius = radius;
    this.segments = segments;
    this.color = color;
    this.opacity = opacity;
    this.disposed = false;
  }

  async mount(context) {
    const { scene, signal } = context;
    this.setDebugStatus(context, 'loading');
    const points = this.points ?? await loadJson(this.source, signal);
    if (this.disposed || signal.aborted) return;

    const transform = new THREE.Object3D();
    const pointCount = this.countPoints(points);

    this.geometry = new THREE.CircleGeometry(this.radius, this.segments);
    this.material = new THREE.MeshStandardMaterial({
      color: this.color,
      metalness: 0,
      roughness: 0,
      transparent: true,
      opacity: this.opacity,
      alphaTest: 0.02,
    });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, pointCount);
    this.mesh.layers.enable(1);

    let index = 0;
    for (const key in points) {
      if (!Object.hasOwn(points, key)) continue;
      const data = points[key];
      transform.position.set(data.position.x, data.position.y, data.position.z);
      transform.lookAt(data.lookAt.x, data.lookAt.y, data.lookAt.z);
      transform.updateMatrix();
      this.mesh.setMatrixAt(index, transform.matrix);
      index += 1;
    }

    scene.add(this.mesh);
    this.setDebugStatus(context, 'mounted', { count: pointCount, source: this.source ?? 'inline' });
  }

  countPoints(points) {
    let count = 0;
    // Avoid Object.values/Object.entries here; this dataset is large enough that
    // duplicated arrays noticeably raise startup memory.
    for (const key in points) {
      if (!Object.hasOwn(points, key)) continue;
      count += 1;
    }
    return count;
  }

  dispose({ scene }) {
    this.disposed = true;
    if (this.mesh) scene.remove(this.mesh);
    this.geometry?.dispose();
    this.material?.dispose();
  }

  setVisible(visible) {
    if (this.mesh) {
      this.mesh.visible = visible;
    }
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    if (this.material) {
      this.material.opacity = opacity;
      this.material.needsUpdate = true;
    }
  }

  setDebugStatus(context, status, extra = {}) {
    this.debugStatus = { status, ...extra };
    if (context.debug) {
      context.debug.layers[this.id] = this.debugStatus;
    }
  }
}
