import cameraProperties from '../../utils/camera_properties.json';
import type {
  Attribution,
  EarthAsset,
  EarthLayerManifest,
  EarthProfile,
} from './types';

export const attributions: Record<string, Attribution> = {
  'local-source-pending': {
    id: 'local-source-pending',
    sourceName: 'Local project asset',
    licenseName: 'Source pending',
    requiredText: 'Local project asset. Source and license metadata pending.',
    processingNotes: 'Placeholder attribution until authoritative source metadata is registered.',
  },
};

export const assets: Record<string, EarthAsset> = {
  'retro-points-local': {
    id: 'retro-points-local',
    name: 'Retro Earth point cloud',
    type: 'point-data',
    format: 'json',
    url: '/globe-assets/points.txt',
    sourceName: 'Local project asset',
    license: 'Source pending',
    attribution: 'Local project point data. Source and license metadata pending.',
    version: 'local-2026-06-27',
    processingNotes: 'Existing point cloud data retained as part of the retro-earth visual profile.',
  },
  'migration-arcs-local': {
    id: 'migration-arcs-local',
    name: 'Legacy migration arcs',
    type: 'arc-data',
    format: 'json',
    url: '/globe-assets/endPointCurves.txt',
    sourceName: 'Local project asset',
    license: 'Source pending',
    attribution: 'Local project arc data. Source and license metadata pending.',
    version: 'local-2026-06-27',
    processingNotes: 'Registered for future use, but hidden from default Earth profiles.',
  },
};

export const layers: Record<string, EarthLayerManifest> = {
  'retro-surface': {
    id: 'retro-surface',
    name: 'Retro Earth surface',
    category: 'physical-surface',
    type: 'planet-surface',
    assetIds: [],
    defaultVisible: true,
    opacity: 1,
    order: 10,
    interactionEnabled: false,
    attributionIds: ['local-source-pending'],
    rendererOptions: {
      color: 0x000000,
      radius: 5,
      segments: 250,
      atmosphereScale: 1.4,
      atmosphereVisible: true,
      ambientLightIntensity: 1,
    },
  },
  'retro-points': {
    id: 'retro-points',
    name: 'Retro Earth point cloud',
    category: 'reference-geography',
    type: 'surface-points',
    assetIds: ['retro-points-local'],
    defaultVisible: true,
    opacity: 1,
    order: 20,
    interactionEnabled: false,
    attributionIds: ['local-source-pending'],
    rendererOptions: {
      source: '/globe-assets/points.txt',
    },
    performanceHints: {
      loadPriority: 1,
    },
  },
  'minimal-test-surface': {
    id: 'minimal-test-surface',
    name: 'Minimal test surface',
    category: 'physical-surface',
    type: 'planet-surface',
    assetIds: [],
    defaultVisible: true,
    opacity: 1,
    order: 10,
    interactionEnabled: false,
    attributionIds: ['local-source-pending'],
    rendererOptions: {
      color: 0x16343d,
      radius: 5,
      segments: 96,
      atmosphereScale: 1.18,
      atmosphereVisible: true,
      ambientLightIntensity: 0.85,
    },
  },
  'legacy-migration-arcs': {
    id: 'legacy-migration-arcs',
    name: 'Legacy migration arcs',
    category: 'debug',
    type: 'migration-arcs',
    assetIds: ['migration-arcs-local'],
    defaultVisible: false,
    opacity: 1,
    order: 60,
    interactionEnabled: false,
    attributionIds: ['local-source-pending'],
    rendererOptions: {
      source: '/globe-assets/endPointCurves.txt',
    },
  },
  'legacy-location-ring': {
    id: 'legacy-location-ring',
    name: 'Legacy location ring',
    category: 'debug',
    type: 'location-ring',
    assetIds: [],
    defaultVisible: false,
    opacity: 1,
    order: 70,
    interactionEnabled: true,
    attributionIds: ['local-source-pending'],
    rendererOptions: {
      locations: [{ lat: 19.076, lon: 72.8777 }],
    },
  },
};

export const profiles: Record<string, EarthProfile> = {
  'retro-earth': {
    id: 'retro-earth',
    name: 'Retro Earth',
    description: 'The current dark MoveBank globe aesthetic with the point-cloud surface layer.',
    defaultCamera: {
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
    defaultTimeMode: 'static',
    defaultLayerIds: ['retro-surface', 'retro-points'],
    availableLayerIds: [
      'retro-surface',
      'retro-points',
      'legacy-migration-arcs',
      'legacy-location-ring',
    ],
    qualityProfiles: {
      low: {
        layerIds: ['retro-surface'],
      },
      medium: {
        layerIds: ['retro-surface', 'retro-points'],
      },
      high: {
        layerIds: ['retro-surface', 'retro-points'],
      },
    },
    attributionIds: ['local-source-pending'],
  },
  'minimal-earth-test': {
    id: 'minimal-earth-test',
    name: 'Minimal Earth Test',
    description: 'A small second profile used to verify that Earth rendering is profile-driven.',
    defaultCamera: {
      position: [0, 5, 6.7],
    },
    controls: cameraProperties,
    postprocessing: {
      bloom: {
        threshold: 0.08,
        strength: 1.5,
        radius: 0.18,
      },
    },
    defaultTimeMode: 'static',
    defaultLayerIds: ['minimal-test-surface'],
    availableLayerIds: ['minimal-test-surface'],
    qualityProfiles: {
      low: {
        layerIds: ['minimal-test-surface'],
      },
      medium: {
        layerIds: ['minimal-test-surface'],
      },
      high: {
        layerIds: ['minimal-test-surface'],
      },
    },
    attributionIds: ['local-source-pending'],
  },
};
