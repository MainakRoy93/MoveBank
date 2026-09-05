# Base Earth Model Architecture Plan

## 1. Purpose

Build a configurable, reusable base Earth model that can later support animal movement, environmental layers, and storytelling experiences.

This phase is only about the Earth itself.

Do not build animal tracks, Movebank integration, migrations, species entities, or story journeys yet.

The goal is to create a solid architectural foundation:

> A configurable planetary scene system with source-aware assets, swappable layers, time-aware lighting, and a generic layer manager.

---

## 2. Product Intent

The Earth should not be a static textured sphere.

It should be a configurable planetary renderer capable of supporting multiple Earth profiles, such as:

* Natural Earth
* Night Earth
* Terrain Earth
* Ocean Earth
* Minimal Earth
* Future Animal Earth

The base system should make it easy to change:

* surface textures
* atmosphere style
* cloud visibility
* city lights
* borders
* rivers
* coastlines
* day/night behavior
* layer order
* layer opacity
* asset sources
* attribution

All of this should be controlled through configuration, not hardcoded scene logic.

---

## 3. Scope

### In scope

Build the architecture for:

* 3D Earth rendering
* configurable Earth profiles
* configurable base layers
* asset registry
* attribution metadata
* layer manager
* time controller
* day/night lighting
* camera controls
* basic interaction system
* frontend renderer boundaries
* backend/API contract boundaries
* future asset pipeline structure

### Out of scope

Do not build:

* animal movement
* Movebank ingestion
* migration routes
* species entities
* environmental science overlays
* live weather
* BirdCast/eBird integration
* story mode
* user accounts
* complex GIS editing
* full tile server
* real-time streaming

---

## 4. High-Level Architecture

The base Earth system should be separated into five major areas:

```text
Source Earth Assets
        ↓
Earth Asset Pipeline
        ↓
Object Storage / Static Asset Hosting
        ↓
Earth Registry API
        ↓
Three.js Earth Client
```

The frontend should not directly know which texture, layer, or attribution belongs to which Earth profile.

The frontend should request an Earth profile from the API and render what the profile describes.

---

## 5. Core Design Principle

Use this rule throughout the build:

> Make layers declarative. Make rendering generic. Make provenance mandatory.

Meaning:

* Do not hardcode “NASA texture” inside the renderer.
* Do not hardcode “borders layer” as special-case logic.
* Do not hardcode “night mode” as a separate app.
* Instead, define Earth profiles and layers through configuration.

The renderer should know how to render layer types.

The API/config should say which layers exist.

---

## 6. Recommended Technical Stack

### Frontend

Use:

* React
* Vite
* TypeScript
* Three.js
* Zustand or similar lightweight state store
* Web Workers later if needed
* IndexedDB or browser cache later if needed

### Backend

For this phase, keep the backend simple.

Use one of:

* FastAPI
* Node/NestJS
* Express with TypeScript

The backend does not need complex geospatial processing yet.

It should initially serve:

* Earth profiles
* layer manifests
* asset metadata
* attribution metadata

### Storage

For the MVP:

* static files can live in `public/` or local object storage
* later migrate to S3-compatible object storage or CDN

Future-friendly storage concepts:

* raw asset zone
* processed asset zone
* frontend-ready asset zone

---

## 7. System Modules

## 7.1 Frontend Modules

### GlobeScene

Responsible for:

* creating Three.js scene
* renderer setup
* camera setup
* orbit controls
* render loop
* scene cleanup
* resize handling

This should be the top-level Three.js container.

---

### PlanetMesh

Responsible for:

* creating Earth geometry
* applying Earth material
* updating material based on time/layer config
* supporting future sphere/ellipsoid options

Initial implementation can use a sphere.

Coordinate logic should still assume standard latitude/longitude semantics.

---

### MaterialCompositor

Responsible for combining:

* day texture
* night texture
* surface shading
* normal/bump map
* ocean/land visual behavior
* lighting response

The material compositor should be driven by the active Earth profile.

---

### AtmosphereRenderer

Responsible for:

* atmosphere shell
* rim glow
* horizon softness
* configurable atmosphere intensity
* different atmosphere styles per profile

This should be separate from the Earth surface.

---

### CloudLayerRenderer

Responsible for:

* transparent cloud shell
* cloud opacity
* cloud rotation speed
* cloud visibility toggle

For MVP, clouds can be a simple static texture on a slightly larger sphere.

---

### LayerManager

Responsible for:

* loading layer manifests
* creating layer renderers
* toggling layer visibility
* applying layer opacity
* applying layer order
* disposing unused layers
* exposing active layer state to UI

This is one of the most important modules.

The layer manager should not know the business meaning of each layer. It should only route layer configs to the correct renderer.

---

### RasterLayerRenderer

Responsible for raster-style layers such as:

* day surface texture
* night lights
* clouds
* elevation shading
* bathymetry texture later
* snow/ice texture later

Initial raster layers may use global equirectangular textures.

---

### VectorLayerRenderer

Responsible for vector-style layers such as:

* coastlines
* borders
* rivers
* lakes
* graticule

For MVP, this can load simplified GeoJSON-style data.

Later, it can support vector tiles.

---

### TimeController

Responsible for:

* current time
* manual time override
* real-time mode
* sun direction
* day/night terminator
* night light blending

This should exist now, even before animal movement is added.

Migration and environmental behavior later will depend on time.

---

### CoordinateService

Responsible for:

* latitude/longitude to 3D conversion
* altitude-aware position conversion
* camera targeting from geographic coordinates
* future utility methods for paths and markers

This should be isolated and heavily reused.

---

### AssetLoader

Responsible for:

* loading textures
* caching loaded assets
* managing loading states
* handling fallback assets
* supporting low/medium/high resolution assets later
* disposing textures safely

---

### AttributionPanel

Responsible for displaying:

* active Earth profile attribution
* active layer attribution
* source names
* license notes
* processing notes

Attribution should be built into the architecture from the beginning.

---

## 7.2 Backend Modules

### Earth Profile Service

Responsible for serving Earth profile definitions.

An Earth profile defines:

* profile ID
* display name
* description
* default camera
* default lighting mode
* atmosphere settings
* default visible layers
* available layers
* time behavior
* attribution bundle

Example profiles:

* `natural-earth`
* `night-earth`
* `terrain-earth`
* `minimal-earth`

---

### Layer Registry Service

Responsible for serving all registered Earth layers.

A layer should include:

* layer ID
* display name
* category
* layer type
* asset references
* default visibility
* opacity
* order
* min/max zoom or camera distance
* interaction settings
* attribution
* performance hints

Layer types should include:

* surface-raster
* overlay-raster
* vector-line
* vector-polygon
* atmosphere
* cloud-shell
* lighting
* label

---

### Asset Registry Service

Responsible for serving asset metadata.

An asset should include:

* asset ID
* asset type
* file format
* resolution
* URL
* fallback URL
* checksum/version
* source
* attribution
* license
* processing notes

---

### Attribution Service

Responsible for collecting attribution across:

* active profile
* active layers
* active assets

The frontend should be able to ask:

> What attribution must I show for this profile and these layers?

---

## 8. Base Earth Data Model

## 8.1 EarthProfile

Represents a configured version of Earth.

Fields:

* id
* name
* description
* defaultCamera
* defaultTimeMode
* lightingConfig
* atmosphereConfig
* cloudConfig
* defaultLayerIds
* availableLayerIds
* qualityProfiles
* attributionIds

---

## 8.2 EarthLayer

Represents one renderable layer.

Fields:

* id
* name
* category
* type
* assetIds
* defaultVisible
* opacity
* order
* blendMode
* minCameraDistance
* maxCameraDistance
* interactionEnabled
* legendConfig
* attributionIds
* performanceHints

Layer categories:

* physical-surface
* reference-geography
* lighting-atmosphere
* human-reference
* labels
* debug

---

## 8.3 EarthAsset

Represents a specific asset file.

Fields:

* id
* name
* type
* format
* url
* fallbackUrl
* resolution
* sourceName
* sourceUrl
* license
* attribution
* version
* checksum
* processingNotes

Asset types:

* day-texture
* night-texture
* cloud-texture
* normal-map
* elevation-map
* vector-geojson
* vector-tile
* label-data
* starfield

---

## 8.4 Attribution

Represents attribution and license information.

Fields:

* id
* sourceName
* sourceUrl
* licenseName
* licenseUrl
* requiredText
* usageNotes
* dateAccessed
* processingNotes

---

## 9. Initial Earth Profiles

## 9.1 Natural Earth

Purpose:

A clean, calm, default Earth.

Default layers:

* day surface texture
* subtle atmosphere
* clouds
* optional coastlines

Disabled by default:

* borders
* night lights
* rivers
* labels

---

## 9.2 Night Earth

Purpose:

A time-aware Earth with day/night contrast.

Default layers:

* day surface texture
* night lights
* day/night terminator
* atmosphere
* clouds

Features:

* current-time mode
* manual time slider
* stronger twilight atmosphere

---

## 9.3 Terrain Earth

Purpose:

A physical-geography-focused Earth.

Default layers:

* day texture
* elevation/normal map
* rivers
* lakes
* coastlines
* subtle borders optional

Future layers:

* bathymetry
* snow/ice
* terrain exaggeration

---

## 9.4 Minimal Earth

Purpose:

A low-performance fallback.

Default layers:

* low-res day texture
* simple lighting
* no clouds
* no vector overlays
* basic controls

---

## 10. Base Layer Types

## 10.1 Surface Raster Layer

Used for the main Earth surface.

Examples:

* day texture
* terrain texture
* ocean texture

Renderer behavior:

* applied directly to Earth material
* may have resolution variants
* should support fallback loading

---

## 10.2 Overlay Raster Layer

Used for layers blended onto the surface or shell.

Examples:

* night lights
* snow
* vegetation
* bathymetry
* cloud texture

Renderer behavior:

* can blend with opacity
* can be toggled
* may be time-aware later

---

## 10.3 Vector Line Layer

Used for line-based geography.

Examples:

* borders
* coastlines
* rivers
* graticule

Renderer behavior:

* loaded from simplified vector assets
* rendered slightly above the globe surface
* supports opacity, color, and line width
* can be toggled

---

## 10.4 Vector Polygon Layer

Used later for areas.

Examples:

* lakes
* ice extent
* protected areas
* land cover regions

Renderer behavior:

* rendered slightly above surface
* supports fill opacity and stroke
* can be toggled

---

## 10.5 Atmosphere Layer

Used for atmospheric glow.

Renderer behavior:

* separate shell or shader pass
* configurable color, thickness, and intensity
* profile-specific

---

## 10.6 Cloud Shell Layer

Used for clouds.

Renderer behavior:

* transparent sphere slightly larger than Earth
* slow rotation
* configurable opacity
* optional toggle

---

## 10.7 Lighting Layer

Used for day/night behavior.

Renderer behavior:

* controls sun direction
* controls night light visibility
* controls terminator blending
* tied to TimeController

---

## 11. API Contract

The API should be configuration-first.

Minimum endpoints:

### Profiles

* list Earth profiles
* get Earth profile by ID

### Layers

* list Earth layers
* get layer by ID
* list layers for a profile

### Assets

* get asset metadata
* get asset manifest for a profile

### Attribution

* get attribution for profile
* get attribution for selected layers

No animal, species, or movement endpoints in this phase.

---

## 12. Frontend Load Flow

The frontend should load Earth in this sequence:

1. Request selected Earth profile.
2. Request layer manifests for that profile.
3. Request asset metadata for required layers.
4. Initialize Three.js scene.
5. Render low-resolution Earth surface first.
6. Load atmosphere and controls.
7. Load clouds.
8. Load optional vector overlays.
9. Load higher-resolution assets when available.
10. Show attribution for active profile and layers.

The user should see the globe quickly, even if high-resolution layers are still loading.

---

## 13. Layer Loading Priority

Use priority-based loading.

Priority 1:

* low-res Earth surface
* camera
* basic lighting

Priority 2:

* atmosphere
* controls
* medium-res Earth texture

Priority 3:

* clouds
* night lights
* vector coastlines

Priority 4:

* borders
* rivers
* lakes
* high-res assets

Priority 5:

* labels
* optional refinements
* profile-specific detail layers

---

## 14. Performance Strategy

The base Earth should support progressive quality.

Quality levels:

### Low

* low-res texture
* no clouds
* simple atmosphere
* no vector overlays

### Medium

* medium texture
* clouds
* subtle atmosphere
* selected vector overlays

### High

* high texture
* clouds
* night lights
* vector overlays
* better atmosphere
* normal map

The frontend should select a default quality based on device capability and allow manual override later.

---

## 15. Asset Pipeline Architecture

The asset pipeline does not need to be fully automated in the MVP, but the structure should be designed now.

Pipeline stages:

1. Register source asset.
2. Store raw source asset.
3. Normalize format/projection.
4. Generate web-ready versions.
5. Generate low/medium/high variants.
6. Generate thumbnails/previews.
7. Attach attribution metadata.
8. Publish asset to static storage.
9. Register asset in the asset registry.
10. Attach asset to one or more layers.

---

## 16. Suggested Repository Structure

Use a structure that keeps rendering, configuration, and asset metadata separate.

Recommended conceptual structure:

```text
/apps
  /web
    React + Vite frontend

/services
  /earth-api
    Earth profile, layer, asset, attribution API

/packages
  /earth-engine
    Three.js globe engine
    layer manager
    coordinate service
    renderers

  /earth-config
    shared types and schemas for profiles, layers, assets

  /asset-pipeline
    scripts/tools for preparing base Earth assets

/data
  /raw
    original source assets

  /processed
    normalized/generated assets

  /manifests
    profile, layer, asset, attribution manifests
```

This can be adjusted depending on whether the project starts as a monorepo or single app.

---

## 17. Implementation Milestones

## Milestone 1: Static Earth Renderer

Goal:

Render a basic Earth scene.

Deliverables:

* Three.js scene
* camera controls
* Earth sphere
* day texture
* simple lighting
* subtle atmosphere
* loading state
* attribution display placeholder

No API required yet if local manifest is faster.

---

## Milestone 2: Config-Driven Earth Profile

Goal:

Load Earth from a profile manifest.

Deliverables:

* EarthProfile schema
* local profile manifest
* local asset manifest
* frontend profile loader
* renderer uses config instead of hardcoded assets

---

## Milestone 3: Layer Manager

Goal:

Add generic layer loading and toggling.

Deliverables:

* EarthLayer schema
* LayerManager module
* raster layer support
* cloud layer support
* vector line layer support
* layer visibility state
* basic layer panel UI

---

## Milestone 4: Day/Night System

Goal:

Make Earth time-aware.

Deliverables:

* TimeController
* sun direction calculation boundary
* night light layer
* day/night blending
* manual time control
* real-time mode

---

## Milestone 5: Vector Reference Geography

Goal:

Support reference layers.

Deliverables:

* coastline layer
* borders layer
* rivers layer
* lakes layer
* configurable opacity/order
* attribution per layer

---

## Milestone 6: Earth Registry API

Goal:

Move manifests behind an API.

Deliverables:

* profile endpoints
* layer endpoints
* asset endpoints
* attribution endpoints
* frontend API client
* local fallback manifests

---

## Milestone 7: Asset Pipeline Skeleton

Goal:

Create repeatable structure for assets.

Deliverables:

* raw asset folder
* processed asset folder
* asset manifest generation concept
* versioned assets
* attribution metadata
* thumbnail/preview generation placeholder

---

## Milestone 8: Earth Profile Switching

Goal:

Support multiple Earth identities.

Deliverables:

* Natural Earth profile
* Night Earth profile
* Terrain Earth profile
* Minimal Earth profile
* profile switch UI
* safe cleanup/reload between profiles

---

## 18. Acceptance Criteria

The base Earth architecture is successful when:

* Earth renders without hardcoded profile assumptions.
* A profile manifest can change the visual identity of the globe.
* Layers can be toggled without changing renderer code.
* Attributions are shown for active layers.
* Day/night behavior is controlled by the time system.
* The renderer supports low/medium/high quality concepts.
* New base layers can be added through manifests.
* Animal movement can later be added as a new layer type without rewriting the Earth renderer.

---

## 19. Architectural Boundaries

Keep these boundaries strict:

### Earth renderer should not know:

* animal species
* migration routes
* Movebank
* BirdCast
* eBird
* story chapters
* scientific interpretation

### Earth renderer should know:

* how to render a planet
* how to load layers
* how to apply time and lighting
* how to place vector/raster layers
* how to convert lat/lon to 3D
* how to display attribution

### API should know:

* profiles
* layers
* assets
* attribution
* configuration

### Asset pipeline should know:

* raw sources
* processed outputs
* generated web assets
* license metadata
* versioning

---

## 20. North Star

The base Earth model should become a stable stage for everything that comes later.

Do not optimize for showing animal paths yet.

Optimize for:

* configurability
* visual credibility
* source awareness
* layer discipline
* time-awareness
* extensibility
* clean rendering boundaries

The final result of this phase should be:

> A configurable Earth platform, not a one-off globe demo.
