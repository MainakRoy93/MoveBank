import cameraProperties from '../../utils/camera_properties.json';
import { EarthLayer } from '../layers/EarthLayer.js';
import { PointLayer } from '../layers/PointLayer.js';
import { ArcLayer } from '../layers/ArcLayer.js';
import { LocationRingLayer } from '../layers/LocationRingLayer.js';

export function createMoveBankGlobeConfig() {
  return {
    camera: {
      position: [0, 5, 6.7],
    },
    controls: cameraProperties,
    postprocessing: {
      bloom: {
        threshold: 0.05,
        strength: 4,
        radius: 0.3,
      },
    },
    layers: [
      new EarthLayer(),
      new PointLayer({ source: '/globe-assets/points.txt' }),
      new ArcLayer({ source: '/globe-assets/endPointCurves.txt' }),
      new LocationRingLayer({
        locations: [{ lat: 19.076, lon: 72.8777 }],
      }),
    ],
  };
}
