export type EarthQuality = 'low' | 'medium' | 'high';

export type EarthLayerType =
  | 'planet-surface'
  | 'surface-points'
  | 'migration-arcs'
  | 'location-ring';

export type EarthLayerCategory =
  | 'physical-surface'
  | 'reference-geography'
  | 'lighting-atmosphere'
  | 'human-reference'
  | 'debug';

export interface CameraConfig {
  fov?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
}

export interface ControlConfig {
  minDistance?: number;
  maxDistance?: number;
  zoomSpeed?: number;
  panSpeed?: number;
}

export interface BloomConfig {
  threshold?: number;
  strength?: number;
  radius?: number;
}

export interface PostprocessingConfig {
  bloom?: BloomConfig;
}

export interface QualityProfile {
  layerIds?: string[];
  assetIds?: string[];
}

export interface EarthProfile {
  id: string;
  name: string;
  description: string;
  defaultCamera?: CameraConfig;
  controls?: ControlConfig;
  postprocessing?: PostprocessingConfig;
  defaultTimeMode: 'realtime' | 'manual' | 'static';
  defaultLayerIds: string[];
  availableLayerIds: string[];
  qualityProfiles?: Partial<Record<EarthQuality, QualityProfile>>;
  attributionIds: string[];
}

export interface EarthLayerManifest {
  id: string;
  name: string;
  category: EarthLayerCategory;
  type: EarthLayerType;
  assetIds: string[];
  defaultVisible: boolean;
  opacity: number;
  order: number;
  blendMode?: 'normal' | 'additive' | 'multiply';
  minCameraDistance?: number;
  maxCameraDistance?: number;
  interactionEnabled: boolean;
  attributionIds: string[];
  rendererOptions?: Record<string, unknown>;
  performanceHints?: Record<string, unknown>;
}

export interface EarthAsset {
  id: string;
  name: string;
  type: string;
  format: string;
  url?: string;
  fallbackUrl?: string;
  resolution?: string;
  sourceName: string;
  sourceUrl?: string;
  license?: string;
  attribution: string;
  version: string;
  checksum?: string;
  processingNotes?: string;
}

export interface Attribution {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  licenseName: string;
  licenseUrl?: string;
  requiredText: string;
  usageNotes?: string;
  dateAccessed?: string;
  processingNotes?: string;
}
