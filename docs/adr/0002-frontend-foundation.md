# ADR 0002: Frontend Foundation

Status: Accepted
Date: 2026-06-28

## Context

The first working slice uses React, Vite, TypeScript, and Three.js. `PRODUCT.md` recommends this stack for the frontend and calls for a reusable Three.js Earth client with strict renderer boundaries.

The app currently remains a single Vite app at the repository root. A future monorepo layout is documented, but moving files now would create import churn before the boundaries are fully stable.

## Decision

Use React + Vite + TypeScript + Three.js as the frontend foundation.

Keep the Vite app at the repository root for now. Use TypeScript for new public interfaces, manifests, and architecture boundaries. Existing JavaScript renderer classes may be migrated incrementally as they are touched by architecture work.

## Consequences

- New architecture contracts can be typed immediately.
- The current app remains easy to run while the system is still forming.
- Some JavaScript and TypeScript will coexist temporarily.
- Moving to `apps/web` is deferred until the package and service boundaries are worth the migration cost.
