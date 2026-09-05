import { Bezier } from '../../utils/bezierCurve.js';
import { getBezierMidPointCoordinates, getCoordinates } from '../../utils/getCoordinates.js';

export function flyCameraToLatLon(camera, lat, lon, radius = 6.5, tween) {
  const startVector = camera.position.clone();
  const control = getBezierMidPointCoordinates(startVector, lat, lon);
  const curve = new Bezier(
    startVector,
    { x: control.x, y: control.y, z: control.z },
    getCoordinates(lat, lon, radius),
  );
  const cameraAnimation = { t: 0 };

  new tween.Tween(cameraAnimation)
    .to({ t: 1 }, 4000)
    .easing(tween.Easing.Cubic.InOut)
    .onUpdate(() => {
      const position = curve.get(cameraAnimation.t);
      camera.position.set(position.x, position.y, position.z);
    })
    .start();
}
