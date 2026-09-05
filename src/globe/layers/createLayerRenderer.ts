import { ArcLayer } from './ArcLayer.js';
import { EarthLayer } from './EarthLayer.js';
import { LocationRingLayer } from './LocationRingLayer.js';
import { PointLayer } from './PointLayer.js';
import type { EarthLayerManifest } from '../registry/types';
import type { LayerRenderer } from './types';

type LegacyLayerConstructor = new (options: Record<string, unknown>) => LayerRenderer;

const PlanetSurfaceLayer = EarthLayer as unknown as LegacyLayerConstructor;
const SurfacePointsLayer = PointLayer as unknown as LegacyLayerConstructor;
const MigrationArcsLayer = ArcLayer as unknown as LegacyLayerConstructor;
const LegacyLocationRingLayer = LocationRingLayer as unknown as LegacyLayerConstructor;

export function createLayerRenderer(layer: EarthLayerManifest): LayerRenderer {
  const options: Record<string, unknown> = {
    id: layer.id,
    opacity: layer.opacity,
    ...(layer.rendererOptions ?? {}),
  };

  switch (layer.type) {
    case 'planet-surface':
      return new PlanetSurfaceLayer(options);
    case 'surface-points':
      return new SurfacePointsLayer(options);
    case 'migration-arcs':
      return new MigrationArcsLayer(options);
    case 'location-ring':
      return new LegacyLocationRingLayer(options);
    default:
      return exhaustiveLayerType(layer.type);
  }
}

function exhaustiveLayerType(layerType: never): never {
  throw new Error(`Unsupported Earth layer type "${layerType}".`);
}
