import type { LayerSelectionOverrides } from './types';

export function parseLayerOverrides(searchParams: URLSearchParams): LayerSelectionOverrides {
  return {
    layerIds: parseLayerList(searchParams.get('layers')),
    hiddenLayerIds: parseLayerList(searchParams.get('hide')),
    opacityByLayerId: parseOpacityMap(searchParams.get('opacity')),
    colorByLayerId: parseColorMap(searchParams.get('color')),
  };
}

function parseLayerList(value: string | null) {
  if (!value) return undefined;

  const layerIds = value
    .split(',')
    .map((layerId) => layerId.trim())
    .filter(Boolean);

  return layerIds.length ? layerIds : undefined;
}

function parseOpacityMap(value: string | null) {
  if (!value) return undefined;

  const entries = value
    .split(',')
    .map((entry) => {
      const [layerId, rawOpacity] = entry.split(':');
      if (!layerId || rawOpacity === undefined) return null;

      const opacity = Number(rawOpacity);
      if (!Number.isFinite(opacity)) return null;

      return [layerId.trim(), clampOpacity(opacity)] as const;
    })
    .filter((entry): entry is readonly [string, number] => Boolean(entry?.[0]));

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function clampOpacity(opacity: number) {
  return Math.min(1, Math.max(0, opacity));
}

function parseColorMap(value: string | null) {
  if (!value) return undefined;

  const entries = value
    .split(',')
    .map((entry) => {
      const [layerId, rawColor] = entry.split(':');
      if (!layerId || rawColor === undefined) return null;

      const color = normalizeHexColor(rawColor);
      if (!color) return null;

      return [layerId.trim(), color] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry?.[0]));

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function normalizeHexColor(value: string) {
  const color = value.trim().replace(/^#/, '');

  if (/^[0-9a-fA-F]{6}$/.test(color)) {
    return `#${color.toLowerCase()}`;
  }

  return null;
}
