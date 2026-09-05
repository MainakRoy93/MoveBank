# ADR 0003: Local Manifests Before Registry API

Status: Accepted
Date: 2026-06-28

## Context

`PRODUCT.md` defines an eventual Earth Registry API for profiles, layers, assets, and attribution. It also allows local manifests before an API is needed.

The current implementation has typed local manifests under `src/globe/registry/` and two profiles: `retro-earth` and `minimal-earth-test`.

## Decision

Use local TypeScript manifests as the temporary source of truth for Earth profiles, layers, assets, and attribution.

Shape these manifests like future API responses so a later `earth-api` service can replace the local loader without changing renderer behavior.

## Consequences

- Profile-driven rendering can develop before backend work begins.
- The frontend can validate manifest shape and loading flow now.
- API design stays grounded in working client needs.
- A migration to real endpoints is still required for Milestone 6.
