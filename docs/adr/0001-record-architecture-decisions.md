# ADR 0001: Record Architecture Decisions

Status: Accepted
Date: 2026-06-28

## Context

`PRODUCT.md` describes a configurable Earth platform that will grow across frontend rendering, manifests, future API boundaries, and asset pipeline concerns. The project is still early, so architecture choices can be made cheaply now but become expensive once layer rendering, profile loading, and asset provenance grow.

## Decision

Use Architecture Decision Records in `docs/adr/` for meaningful technical and product-architecture decisions.

Each ADR records context, decision, and consequences. Accepted ADRs are append-only decision history; later changes should supersede prior ADRs instead of editing their meaning in place.

## Consequences

- Future implementation work has an explicit decision trail.
- The team can distinguish settled constraints from open design space.
- Documentation overhead stays small because ADRs are reserved for durable choices, not every code change.
