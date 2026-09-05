import * as THREE from 'three';
import { loadJson } from '../data/loadJson.js';

class CurveRing {
  constructor(
    curveStart,
    curveEnd,
    controlPoint1,
    controlPoint2,
    ringLookAt,
    numOfDays,
    curveColor = 0xe278de,
    ringColor = 0xffffff,
  ) {
    this.curveStart = curveStart;
    this.curveEnd = curveEnd;
    this.controlPoint1 = controlPoint1;
    this.controlPoint2 = controlPoint2;
    this.ringLookAt = ringLookAt;
    this.curveColor = curveColor;
    this.ringColor = ringColor;
    this.tubeRadius = 0.02;
    this.numOfDays = numOfDays;
    this.animationRatio = 2;
    this.createCurve();
    this.createTube();
    this.createRing();
  }

  createCurve() {
    this.curveObj = new THREE.CubicBezierCurve3(
      new THREE.Vector3(this.curveStart.x, this.curveStart.y, this.curveStart.z),
      new THREE.Vector3(this.controlPoint1.x, this.controlPoint1.y, this.controlPoint1.z),
      new THREE.Vector3(this.controlPoint2.x, this.controlPoint2.y, this.controlPoint2.z),
      new THREE.Vector3(this.curveEnd.x, this.curveEnd.y, this.curveEnd.z),
    );
  }

  createTube() {
    this.tubeGeometry = new THREE.TubeGeometry(this.curveObj, 128, this.tubeRadius, 8, true);
    this.tubeGeometry.setDrawRange(0, 0);
    this.tubeMaterial = new THREE.MeshBasicMaterial({ color: this.curveColor });
    this.curveTube = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);
    this.curveTube.layers.enable(1);
    this.totalVertices = this.tubeGeometry.index.count;
  }

  createRing() {
    this.ringGeometry = new THREE.RingGeometry(this.tubeRadius, this.tubeRadius + 0.03, 32, 2);
    this.ringGeometry.lookAt(new THREE.Vector3(this.ringLookAt.x, this.ringLookAt.y, this.ringLookAt.z));
    this.ringGeometry.translate(this.curveEnd.x, this.curveEnd.y, this.curveEnd.z);
    this.ringMaterial = new THREE.MeshPhongMaterial({
      color: this.curveColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    this.ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
  }

  addToScene(scene) {
    scene.add(this.curveTube);
    scene.add(this.ring);
  }

  getAnimationTime() {
    const months = parseInt(this.numOfDays, 10) / 30;
    return months.toFixed(2) * this.animationRatio * 1000;
  }

  animate(tween) {
    if (this.tubeGeometry.drawRange.count !== 0) return;

    this.curveTube.material.opacity = 1;
    this.animation = { drawCount: 0 };
    new tween.Tween(this.animation)
      .to({ drawCount: this.totalVertices }, this.getAnimationTime())
      .easing(tween.Easing.Linear.None)
      .onUpdate(() => {
        this.tubeGeometry.setDrawRange(0, Math.round(this.animation.drawCount));
      })
      .start()
      .onComplete(() => {
        this.tubeGeometry.setDrawRange(0, 0);
        this.ringAnimation = { opacity: 1 };
        new tween.Tween(this.ringAnimation)
          .to({ opacity: 0 }, 1200)
          .easing(tween.Easing.Cubic.In)
          .onUpdate(() => {
            this.ring.material.side = THREE.FrontSide;
            this.ring.material.opacity = this.ringAnimation.opacity;
            this.curveTube.material.opacity = this.ringAnimation.opacity;
          })
          .start()
          .onComplete(() => {
            this.ring.material.side = THREE.BackSide;
          });
      });
  }

  dispose(scene) {
    scene.remove(this.curveTube);
    scene.remove(this.ring);
    this.tubeGeometry.dispose();
    this.tubeMaterial.dispose();
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
  }
}

export class ArcLayer {
  id = 'migration-arcs';

  constructor({ id = 'migration-arcs', endPointCurves, source, opacity = 1 }) {
    this.id = id;
    this.endPointCurves = endPointCurves;
    this.source = source;
    this.opacity = opacity;
    this.curves = [];
    this.disposed = false;
  }

  async mount(context) {
    const { scene, signal } = context;
    this.setDebugStatus(context, 'loading');
    const endPointCurves = this.endPointCurves ?? await loadJson(this.source, signal);
    if (this.disposed || signal.aborted) return;
    let count = 0;

    for (const animal in endPointCurves) {
      if (!Object.hasOwn(endPointCurves, animal)) continue;
      const animalData = endPointCurves[animal];

      for (const animalId in animalData) {
        if (!Object.hasOwn(animalData, animalId)) continue;
        const data = animalData[animalId];
        const curve = new CurveRing(
          data.curveStart,
          data.curveEnd,
          data.controlPoint1,
          data.controlPoint2,
          data.ringLookAt,
          data.num_of_days,
          data.curveColor,
        );
        curve.curveTube.material.opacity = this.opacity;
        curve.addToScene(scene);
        this.curves.push(curve);
        count += 1;
      }
    }

    this.setDebugStatus(context, 'mounted', { count, source: this.source ?? 'inline' });
  }

  animate(_time, { tween }) {
    this.curves.forEach((curve) => curve.animate(tween));
  }

  dispose({ scene }) {
    this.disposed = true;
    this.curves.forEach((curve) => curve.dispose(scene));
  }

  setVisible(visible) {
    this.curves.forEach((curve) => {
      curve.curveTube.visible = visible;
      curve.ring.visible = visible;
    });
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    this.curves.forEach((curve) => {
      curve.curveTube.material.opacity = opacity;
      curve.ring.material.opacity = Math.min(curve.ring.material.opacity, opacity);
    });
  }

  setDebugStatus(context, status, extra = {}) {
    this.debugStatus = { status, ...extra };
    if (context.debug) {
      context.debug.layers[this.id] = this.debugStatus;
    }
  }
}
