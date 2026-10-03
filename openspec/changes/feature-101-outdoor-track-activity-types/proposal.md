# Proposal

## Why

Track owners need a consistent way to classify their GPX records by activity without conflating an individual track with the broader type of its associated trip. A managed activity-type catalog establishes that foundation now and enables later owner-scoped filtering and slug suggestions without misclassifying existing tracks.

## What Changes

- Add reusable, administrator-managed track activity types with a stable identity, display name, active state, and timestamps.
- Add an optional track-to-activity-type relationship; existing and newly created tracks may remain unclassified.
- Let a track owner select or clear an active activity type while creating or editing only their own track.
- Add administrator-only activity-type management for creating, renaming, activating or deactivating, and safely deleting activity types.
- Preserve deactivated types on already classified tracks, while preventing them from being selected for new or updated classifications.
- Do not derive or copy a track type from the existing trip-level `HikeType` enum.

## Capabilities

### New Capabilities

- `outdoor-track-activity-types`: Administrator management of reusable activity types and owner selection of an active type for individual tracks.

### Modified Capabilities

- `outdoor-tracks`: Track records and owner track-management workflows gain an optional activity-type classification.
- `workspace-access-policy`: The access matrix and server enforcement gain administrator-only management of the global track activity-type catalog.

## Impact

- Affected data: a new activity-type model and a nullable foreign key on `Track`; the forward migration leaves existing rows unclassified.
- Affected routes and UI: `/admin/tracks` and `/my/tracks` gain type selection; a new administrator-only activity-type management surface is added under `/admin`.
- Affected server boundaries: track create/update validation must accept only active types, while activity-type mutations require administrator authorization and preserve owner-scoped track rules.
- No public track type display, public filtering, trip-type replacement, automatic type inference, GPX parsing changes, or new dependencies are included.
