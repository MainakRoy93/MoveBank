import { layers as layerRegistry, profiles } from './manifests';
import type { EarthLayerManifest, EarthProfile, EarthQuality } from './types';

export interface ProfileLayerOptions {
  profile: EarthProfile;
  layers: EarthLayerManifest[];
  defaultLayerIds: string[];
}

export function getProfileLayerOptions(
  profileId: string,
  quality: EarthQuality = 'medium',
): ProfileLayerOptions {
  const profile = profiles[profileId];

  if (!profile) {
    throw new Error(`Unknown Earth profile "${profileId}".`);
  }

  return {
    profile,
    layers: profile.availableLayerIds
      .map((layerId) => {
        const layer = layerRegistry[layerId];

        if (!layer) {
          throw new Error(`Profile "${profile.id}" references unknown layer "${layerId}".`);
        }

        return layer;
      })
      .sort((a, b) => a.order - b.order),
    defaultLayerIds: [
      ...(profile.qualityProfiles?.[quality]?.layerIds ?? profile.defaultLayerIds),
    ],
  };
}
