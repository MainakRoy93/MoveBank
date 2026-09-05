import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { GlobeScene } from './globe/GlobeScene';
import type { ManagedLayerState } from './globe/layers/types';
import { getProfileLayerOptions } from './globe/registry/getProfileLayerOptions';
import { parseLayerOverrides } from './globe/registry/parseLayerOverrides';
import type { EarthLayerManifest, EarthQuality } from './globe/registry/types';
import { LayerPanel } from './globe/ui/LayerPanel';

const defaultProfileId = 'retro-earth';
const defaultQuality: EarthQuality = 'medium';
const pointLayerId = 'retro-points';
const pointColorOptions = ['#3a4494', '#8eeed2', '#ff9aa8', '#ffe66d', '#b48cff'];
type CssVariables = CSSProperties & Record<`--${string}`, string>;

interface SceneSettings {
  profileId: string;
  quality: EarthQuality;
  selectedLayerIds: string[];
  opacityByLayerId: Record<string, number>;
  colorByLayerId: Record<string, string>;
  hasExplicitLayerSelection: boolean;
}

export default function App() {
  const [sceneSettings, setSceneSettings] = useState(readSceneSettingsFromUrl);
  const [layerStates, setLayerStates] = useState<ManagedLayerState[]>([]);
  const [isLayerPanelOpen, setLayerPanelOpen] = useState(false);

  const layerOptions = useMemo(
    () => getProfileLayerOptions(sceneSettings.profileId, sceneSettings.quality),
    [sceneSettings.profileId, sceneSettings.quality],
  );

  const lockedLayerIds = useMemo(
    () => getLockedLayerIds(layerOptions.layers),
    [layerOptions.layers],
  );
  const hasPointLayer = layerOptions.layers.some((layer) => layer.id === pointLayerId);
  const activeColorByLayerId = useMemo(
    () => (hasPointLayer ? sceneSettings.colorByLayerId : {}),
    [hasPointLayer, sceneSettings.colorByLayerId],
  );

  const layerOverrides = useMemo(
    () => ({
      layerIds: sceneSettings.selectedLayerIds,
      opacityByLayerId: sceneSettings.opacityByLayerId,
      colorByLayerId: activeColorByLayerId,
    }),
    [
      activeColorByLayerId,
      sceneSettings.opacityByLayerId,
      sceneSettings.selectedLayerIds,
    ],
  );

  const pointColor = sceneSettings.colorByLayerId[pointLayerId] ?? pointColorOptions[0];

  useEffect(() => {
    const handlePopState = () => {
      setSceneSettings(readSceneSettingsFromUrl());
      setLayerStates([]);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    writeSceneSettingsToUrl(sceneSettings, layerOptions.defaultLayerIds);
  }, [layerOptions.defaultLayerIds, sceneSettings]);

  const toggleLayer = useCallback((
    layerId: string,
    selected: boolean,
  ) => {
    if (lockedLayerIds.includes(layerId)) return;

    setLayerStates([]);
    setSceneSettings((current) => {
      const selectedIds = new Set(current.selectedLayerIds);

      if (selected) {
        selectedIds.add(layerId);
      } else {
        selectedIds.delete(layerId);
      }

      lockedLayerIds.forEach((lockedLayerId) => selectedIds.add(lockedLayerId));

      return {
        ...current,
        selectedLayerIds: sortLayerIds([...selectedIds], layerOptions.layers),
        hasExplicitLayerSelection: true,
      };
    });
  }, [layerOptions.layers, lockedLayerIds]);

  const changeLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setSceneSettings((current) => ({
      ...current,
      opacityByLayerId: {
        ...current.opacityByLayerId,
        [layerId]: clampOpacity(opacity),
      },
    }));
  }, []);

  const changePointColor = useCallback((color: string) => {
    if (!pointColorOptions.includes(color)) return;

    setLayerStates([]);
    setSceneSettings((current) => ({
      ...current,
      colorByLayerId: {
        ...current.colorByLayerId,
        [pointLayerId]: color,
      },
    }));
  }, []);

  return (
    <div
      className="globeApp"
      style={{ '--point-color': pointColor } as CssVariables}
    >
      <GlobeScene
        profileId={sceneSettings.profileId}
        quality={sceneSettings.quality}
        layerOverrides={layerOverrides}
        onLayerStatesChange={setLayerStates}
      />
      <div className="globeUi">
        <LayerPanel
          layers={layerOptions.layers}
          selectedLayerIds={sceneSettings.selectedLayerIds}
          lockedLayerIds={lockedLayerIds}
          opacityByLayerId={sceneSettings.opacityByLayerId}
          pointLayerId={pointLayerId}
          pointColor={pointColor}
          pointColorOptions={pointColorOptions}
          layerStates={layerStates}
          isOpen={isLayerPanelOpen}
          onToggleOpen={() => setLayerPanelOpen((isOpen) => !isOpen)}
          onToggleLayer={toggleLayer}
          onChangeOpacity={changeLayerOpacity}
          onChangePointColor={changePointColor}
        />
      </div>
    </div>
  );
}

function readSceneSettingsFromUrl(): SceneSettings {
  const searchParams = new URLSearchParams(window.location.search);
  const profileId = searchParams.get('profile') ?? defaultProfileId;
  const quality = readQuality(searchParams.get('quality'));
  const parsedOverrides = parseLayerOverrides(searchParams);
  const layerOptions = getProfileLayerOptions(profileId, quality);
  const hiddenLayerIds = new Set(parsedOverrides.hiddenLayerIds ?? []);
  const selectedLayerIds = parsedOverrides.layerIds
    ?? layerOptions.defaultLayerIds.filter((layerId) => !hiddenLayerIds.has(layerId));
  const lockedLayerIds = getLockedLayerIds(layerOptions.layers);

  return {
    profileId,
    quality,
    selectedLayerIds: sortLayerIds(
      Array.from(new Set([...selectedLayerIds, ...lockedLayerIds])),
      layerOptions.layers,
    ),
    opacityByLayerId: parsedOverrides.opacityByLayerId ?? {},
    colorByLayerId: {
      [pointLayerId]: getInitialPointColor(parsedOverrides.colorByLayerId?.[pointLayerId]),
    },
    hasExplicitLayerSelection: parsedOverrides.layerIds !== undefined
      || parsedOverrides.hiddenLayerIds !== undefined,
  };
}

function writeSceneSettingsToUrl(
  settings: SceneSettings,
  defaultLayerIds: string[],
) {
  const params = new URLSearchParams(window.location.search);

  if (settings.profileId === defaultProfileId) {
    params.delete('profile');
  } else {
    params.set('profile', settings.profileId);
  }

  if (settings.quality === defaultQuality) {
    params.delete('quality');
  } else {
    params.set('quality', settings.quality);
  }

  params.delete('hide');

  if (
    settings.hasExplicitLayerSelection
    || !haveSameItems(settings.selectedLayerIds, defaultLayerIds)
  ) {
    params.set('layers', settings.selectedLayerIds.join(','));
  } else {
    params.delete('layers');
  }

  const opacityParam = Object.entries(settings.opacityByLayerId)
    .map(([layerId, opacity]) => `${layerId}:${clampOpacity(opacity)}`)
    .join(',');

  if (opacityParam) {
    params.set('opacity', opacityParam);
  } else {
    params.delete('opacity');
  }

  const pointColor = settings.colorByLayerId[pointLayerId];

  if (
    settings.selectedLayerIds.includes(pointLayerId)
    && pointColor
    && pointColor !== pointColorOptions[0]
  ) {
    params.set('color', `${pointLayerId}:${pointColor.replace('#', '')}`);
  } else {
    params.delete('color');
  }

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;

  if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, '', nextUrl);
  }
}

function getLockedLayerIds(layers: EarthLayerManifest[]) {
  return layers
    .filter((layer) => layer.category === 'physical-surface' || layer.id === pointLayerId)
    .map((layer) => layer.id);
}

function sortLayerIds(layerIds: string[], layers: EarthLayerManifest[]) {
  const orderById = new Map(layers.map((layer) => [layer.id, layer.order]));

  return [...layerIds].sort((first, second) => {
    return (orderById.get(first) ?? 0) - (orderById.get(second) ?? 0);
  });
}

function readQuality(value: string | null): EarthQuality {
  if (value === 'low' || value === 'high') return value;
  return defaultQuality;
}

function clampOpacity(opacity: number) {
  if (Number.isNaN(opacity)) return 1;
  return Math.min(1, Math.max(0, opacity));
}

function haveSameItems(first: string[], second: string[]) {
  if (first.length !== second.length) return false;

  const secondItems = new Set(second);
  return first.every((item) => secondItems.has(item));
}

function getInitialPointColor(color: string | undefined) {
  if (color && pointColorOptions.includes(color)) {
    return color;
  }

  return pointColorOptions[0];
}
