import { layers, profiles } from './manifests';
import type {
  EarthLayerManifest,
  EarthProfile,
  EarthQuality,
  LayerSelectionOverrides,
} from './types';

export interface ResolvedEarthProfile {
  profile: EarthProfile;
  layers: EarthLayerManifest[];
}

export function resolveEarthProfile(
  profileId: string,
  quality: EarthQuality = 'medium',
  layerOverrides: LayerSelectionOverrides = {},
): ResolvedEarthProfile {
  const profile = profiles[profileId];

  if (!profile) {
    throw new Error(`Unknown Earth profile "${profileId}".`);
  }

  const profileLayerIds = layerOverrides.layerIds
    ?? profile.qualityProfiles?.[quality]?.layerIds
    ?? profile.defaultLayerIds;
  validateLayerIds(profile, profileLayerIds);
  validateLayerIds(profile, layerOverrides.hiddenLayerIds ?? []);
  validateLayerIds(profile, Object.keys(layerOverrides.opacityByLayerId ?? {}));
  validateLayerIds(profile, Object.keys(layerOverrides.colorByLayerId ?? {}));

  const hiddenLayerIds = new Set(layerOverrides.hiddenLayerIds ?? []);
  const explicitLayerIds = new Set(layerOverrides.layerIds ?? []);
  const layerManifests = profileLayerIds
    .map((layerId) => {
      const layer = layers[layerId];

      if (!layer) {
        throw new Error(`Profile "${profile.id}" references unknown layer "${layerId}".`);
      }

      return {
        ...layer,
        defaultVisible: !hiddenLayerIds.has(layer.id)
          && (explicitLayerIds.has(layer.id) || layer.defaultVisible),
        opacity: layerOverrides.opacityByLayerId?.[layer.id] ?? layer.opacity,
        rendererOptions: applyLayerRendererOverrides(layer, layerOverrides),
      };
    })
    .sort((a, b) => a.order - b.order);

  return {
    profile,
    layers: layerManifests,
  };
}

function applyLayerRendererOverrides(
  layer: EarthLayerManifest,
  layerOverrides: LayerSelectionOverrides,
) {
  const color = layerOverrides.colorByLayerId?.[layer.id];

  if (!color) {
    return layer.rendererOptions;
  }

  return {
    ...(layer.rendererOptions ?? {}),
    color,
  };
}

function validateLayerIds(profile: EarthProfile, layerIds: string[]) {
  const availableLayerIds = new Set(profile.availableLayerIds);

  layerIds.forEach((layerId) => {
    if (!layers[layerId]) {
      throw new Error(`Profile "${profile.id}" references unknown layer "${layerId}".`);
    }

    if (!availableLayerIds.has(layerId)) {
      throw new Error(`Layer "${layerId}" is not available for profile "${profile.id}".`);
    }
  });
}
