# ADR 0005: Provenance Required for Earth Config

Status: Accepted
Date: 2026-06-28

## Context

The base Earth platform will use textures, vector data, generated assets, and future environmental layers. These assets may carry different source, license, processing, and attribution requirements.

The current local assets do not yet have authoritative source metadata, so they are marked as source-pending in the manifest.

## Decision

Profiles, layers, and assets must carry attribution identifiers or explicit source-pending metadata from the beginning.

Unknown provenance should be represented honestly with a `source pending` placeholder instead of omitted. Future asset pipeline work must replace placeholders with authoritative source, license, version, and processing metadata.

## Consequences

- Attribution is part of the architecture, not an afterthought.
- Missing metadata remains visible and trackable.
- The renderer and future API can aggregate attribution from active profile, layers, and assets.
- Asset ingestion work must include license and processing notes, not only file conversion.
