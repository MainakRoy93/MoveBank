import type { CSSProperties } from 'react';
import type { EarthLayerManifest } from '../registry/types';
import type { ManagedLayerState } from '../layers/types';

type CssVariables = CSSProperties & Record<`--${string}`, string>;

interface LayerPanelProps {
  layers: EarthLayerManifest[];
  selectedLayerIds: string[];
  lockedLayerIds?: string[];
  opacityByLayerId: Record<string, number>;
  pointLayerId: string;
  pointColor: string;
  pointColorOptions: string[];
  layerStates: ManagedLayerState[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleLayer: (layerId: string, selected: boolean) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  onChangePointColor: (color: string) => void;
}

const categoryLabels: Record<EarthLayerManifest['category'], string> = {
  'physical-surface': 'Surface',
  'reference-geography': 'Reference',
  'lighting-atmosphere': 'Atmosphere',
  'human-reference': 'Human reference',
  debug: 'Overlay',
};

export function LayerPanel({
  layers,
  selectedLayerIds,
  lockedLayerIds = [],
  opacityByLayerId,
  pointLayerId,
  pointColor,
  pointColorOptions,
  layerStates,
  isOpen,
  onToggleOpen,
  onToggleLayer,
  onChangeOpacity,
  onChangePointColor,
}: LayerPanelProps) {
  const selectedIds = new Set(selectedLayerIds);
  const lockedIds = new Set(lockedLayerIds);
  const statesById = new Map(layerStates.map((state) => [state.id, state]));
  const visibleLayers = layers.filter((layer) => !lockedIds.has(layer.id));

  return (
    <aside
      className={`layerSidebar ${isOpen ? 'isOpen' : 'isCollapsed'}`}
      aria-label="Globe layers"
    >
      <button
        className="layerSidebarToggle"
        type="button"
        aria-label={isOpen ? 'Collapse layer sidebar' : 'Expand layer sidebar'}
        aria-expanded={isOpen}
        onClick={onToggleOpen}
      >
        <span className="layerSidebarIcon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="layerSidebarToggleText">Layers</span>
      </button>

      {isOpen && (
        <div className="layerSidebarBody">
          <header className="layerSidebarHeader">
            <span className="layerSidebarKicker">MoveBank Earth</span>
            <div>
              <h2>Layers</h2>
              <span>{visibleLayers.filter((layer) => selectedIds.has(layer.id)).length}/{visibleLayers.length} overlays on</span>
            </div>
          </header>

          <section className="pointStylePanel" aria-label="Dot color">
            <div className="pointStyleHeader">
              <span>Dot Color</span>
              <span>Map signal</span>
            </div>
            <div className="pointColorSwatches">
              {pointColorOptions.map((color) => (
                <button
                  className="pointColorSwatch"
                  type="button"
                  key={color}
                  style={{ '--swatch-color': color } as CssVariables}
                  aria-label={`Set dot color to ${color}`}
                  aria-pressed={pointColor === color}
                  onClick={() => onChangePointColor(color)}
                />
              ))}
            </div>
          </section>

          <div className="layerList" role="list">
            {visibleLayers.map((layer) => {
              const selected = selectedIds.has(layer.id);
              const state = statesById.get(layer.id);
              const opacity = opacityByLayerId[layer.id] ?? layer.opacity;

              return (
                <section className="layerRow" key={layer.id} role="listitem">
                  <label className="layerToggle">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => onToggleLayer(layer.id, event.currentTarget.checked)}
                    />
                    <span className="layerToggleCopy">
                      <span className="layerName">{layer.name}</span>
                      <span className="layerMeta">
                        {categoryLabels[layer.category]}
                        {' · '}
                        {getLayerStatusLabel(selected, state)}
                      </span>
                    </span>
                  </label>

                  {selected && (
                    <label className="opacityControl">
                      <span>Opacity</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(event) => onChangeOpacity(
                          layer.id,
                          Number(event.currentTarget.value),
                        )}
                      />
                      <span>{Math.round(opacity * 100)}%</span>
                    </label>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

function getLayerStatusLabel(selected: boolean, state?: ManagedLayerState) {
  if (!selected) return 'off';
  if (!state) return 'queued';
  if (state.status === 'mounted') return 'on';
  return state.status;
}
