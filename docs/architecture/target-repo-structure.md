# Target Repository Structure

`PRODUCT.md` describes a future structure that separates app code, reusable Earth engine code, registry/config contracts, services, and data pipeline assets.

## Target Shape

```text
/apps
  /web
    React + Vite frontend

/services
  /earth-api
    Earth profile, layer, asset, and attribution API

/packages
  /earth-engine
    Three.js globe engine
    layer manager
    coordinate service
    renderers

  /earth-config
    shared profile, layer, asset, and attribution types/schemas

  /asset-pipeline
    scripts and tools for preparing base Earth assets

/data
  /raw
    original source assets

  /processed
    normalized or generated assets

  /manifests
    profile, layer, asset, and attribution manifests

/docs
  /adr
    architecture decision records

  /architecture
    system design and migration notes
```

## Boundary Intent

- `apps/web` owns React UI composition and browser runtime concerns.
- `packages/earth-engine` owns rendering lifecycle, layer lifecycle, coordinate conversion, and renderer implementations.
- `packages/earth-config` owns shared schemas and manifest validation.
- `services/earth-api` owns the future network contract for profiles, layers, assets, and attribution.
- `packages/asset-pipeline` owns repeatable asset preparation concepts.
- `data` owns source and processed asset organization.

## Current Deviation

The current repository intentionally keeps the Vite app at the root. This avoids churn while `GlobeScene`, manifests, and the upcoming LayerManager settle.

Do not create empty target folders until they contain useful code or README placeholders. Git will not track empty directories, and premature folders can make ownership look more settled than it is.
