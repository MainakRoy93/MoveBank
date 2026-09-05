import * as THREE from 'three';
import { getCoordinates } from '../../utils/getCoordinates.js';
import { flyCameraToLatLon } from '../controls/cameraFlight.js';

class LocationRing {
  constructor({ lat, lon }, context) {
    this.lat = lat;
    this.lon = lon;
    this.context = context;
    this.location = getCoordinates(lat, lon, 5);
    this.lookAt = getCoordinates(lat, lon, 6.5);
    this.innerRadius = 0.03;
    this.outerRadius = 0.06;
    this.ringColor = 0xffffff;
    this.createRing();
    this.clickEvent();
  }

  createRing(innerRadius = this.innerRadius, opacity = 1) {
    this.ringGeometry = new THREE.RingGeometry(innerRadius, innerRadius + 0.03, 32, 2);
    this.ringGeometry.lookAt(new THREE.Vector3(this.lookAt.x, this.lookAt.y, this.lookAt.z));
    this.ringMaterial = new THREE.MeshPhongMaterial({
      color: this.ringColor,
      transparent: true,
      opacity,
    });
    this.ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
    this.ring.position.set(this.location.x, this.location.y, this.location.z);
  }

  addToScene(scene) {
    scene.add(this.ring);
    this.animate(scene);
  }

  clickEvent() {
    this.context.domEvents.addEventListener(
      this.ring,
      'click',
      () => {
        flyCameraToLatLon(this.context.camera, this.lat, this.lon, 6.5, this.context.tween);
      },
      false,
    );
  }

  animate(scene, expand = true) {
    const startRadius = expand ? this.innerRadius : this.outerRadius;
    const animationRadius = expand ? this.outerRadius : this.innerRadius;
    const startOpacity = expand ? 1 : 0;
    const animationOpacity = expand ? 0 : 1;

    this.animation = { radius: startRadius, opacity: startOpacity };
    new this.context.tween.Tween(this.animation)
      .to({ radius: animationRadius, opacity: animationOpacity }, 1500)
      .easing(this.context.tween.Easing.Linear.None)
      .onUpdate(() => {
        const scale = this.animation.radius / this.innerRadius;
        this.ring.scale.set(scale, scale, scale);
        this.ring.material.opacity = this.animation.opacity;
      })
      .start()
      .onComplete(() => {
        this.animate(scene, !expand);
      });
  }

  disposeRing() {
    this.ringGeometry?.dispose();
    this.ringMaterial?.dispose();
  }

  dispose(scene) {
    scene.remove(this.ring);
    this.disposeRing();
  }
}

export class LocationRingLayer {
  constructor({ locations }) {
    this.locations = locations;
    this.rings = [];
  }

  mount(context) {
    this.rings = this.locations.map((location) => new LocationRing(location, context));
    this.rings.forEach((ring) => ring.addToScene(context.scene));
  }

  dispose({ scene }) {
    this.rings.forEach((ring) => ring.dispose(scene));
  }
}
