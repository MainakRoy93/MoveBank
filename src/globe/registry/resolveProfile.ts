import { layers, profiles } from './manifests';
import type { EarthLayerManifest, EarthProfile, EarthQuality } from './types';

export interface ResolvedEarthProfile {
  profile: EarthProfile;
  layers: EarthLayerManifest[];
}

export function resolveEarthProfile(
  profileId: string,
  quality: EarthQuality = 'medium',
): ResolvedEarthProfile {
  const profile = profiles[profileId];

  if (!profile) {
    throw new Error(`Unknown Earth profile "${profileId}".`);
  }

  const profileLayerIds = profile.qualityProfiles?.[quality]?.layerIds ?? profile.defaultLayerIds;
  const layerManifests = profileLayerIds
    .map((layerId) => {
      const layer = layers[layerId];

      if (!layer) {
        throw new Error(`Profile "${profile.id}" references unknown layer "${layerId}".`);
      }

      return layer;
    })
    .filter((layer) => layer.defaultVisible)
    .sort((a, b) => a.order - b.order);

  return {
    profile,
    layers: layerManifests,
  };
}
