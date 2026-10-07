# Design

## Context

The current map-local selector in `HikeTrackMap` owns its own `selectedDay` state and filters only map layers. `HikeTripMedia` composes the map, linked track cards, and photo gallery, so it is the smallest client boundary that can apply one day selection to all three. Existing map-layer `dayKeys` are based on stored metadata; feature-105 adds a nullable reliable stored capture instant for gallery ordering, but the gallery does not yet receive a day assignment.

## Goals / Non-Goals

**Goals:**

- Keep one client-local selected day in the trip-media composition and pass the resulting visible collections to the map, track-card section, and gallery.
- Derive photo day eligibility only from the stored reliable capture instant already accepted for chronological ordering, using the existing UTC hike-day keys and excluding dates outside the trip range.
- Keep card order, photo-order mode, full-photo access, and lightbox navigation correct for the filtered collections.
- Close a viewer selection that becomes ineligible after the day changes, updating only the existing `photo` query state through `history.replaceState`.

**Non-Goals:**

- No new database fields, migrations, EXIF/GPX reparsing, timezone guessing, or manual photo-date entry.
- No URL persistence, browser-history entries, server-side filtering, or administrator-surface changes for the selected day.
- No change to public visibility, image delivery, map-coordinate review, note assignment, or current photo/track ordering rules.

## Decisions

### Lift day selection to `HikeTripMedia`

`HikeTripMedia` will own the day selection because it already owns the map and gallery coordination. `HikeTrackMap` will become controlled through a selected day and change callback rather than maintaining a separate local filter. This avoids parallel selections and ensures one user choice filters every public trip-media surface.

### Reuse stored UTC day keys and add a visibility-safe photo assignment

Tracks and map markers already carry `dayKeys`. The public photo projection will expose a derived day key only when its reliable stored capture instant maps to an inclusive UTC hike day; photo markers will use the same safe assignment. This reuses the project's existing day convention and prevents a normalized or offset-bearing capture instant from sorting as dated but disappearing from the corresponding selected-day map.

The alternative of deriving gallery dates from browser-local time is rejected because it would make the visible day vary by viewer timezone. Treating ambiguous camera wall-clock timestamps as dated is rejected because it violates the existing no-timezone-guessing boundary.

### Filter before rendering, not inside every child

The parent will derive visible tracks, photos, and markers once for the selected day and pass each child its filtered collection. The gallery's existing chronological/manual sorter and lightbox will therefore operate over exactly the cards on screen. This also limits map bounds fitting to the correct selected-day layers.

### Preserve existing query-state semantics

Day selection stays ephemeral client state. If it removes the currently selected photo from the gallery, the parent will close the viewer and remove only `photo` through native `replaceState`, preserving `photoOrder` and unrelated parameters. No router navigation or extra history entry is introduced.

## Risks / Trade-offs

- [A reliable capture instant near UTC midnight can have a different local calendar date] → Use the established UTC hike-day convention consistently and do not claim a local-day assignment without a future explicit policy.
- [A selected day may leave no cards while the page still has trip content] → Keep the existing map empty state and render only the media eligible for the selected day; `All days` remains one selection away.
- [Moving state can affect map photo-focus behavior] → Preserve the existing focus callback and ensure it does not mutate the chosen shared day or expose ineligible media.

## Migration Plan

1. Deploy without a data migration; stored GPX/EXIF metadata determines all assignments.
2. Existing trip links keep their current `photo` and `photoOrder` behavior; day selection has no URL representation.
3. Roll back by restoring map-local selection and passing unfiltered linked tracks/photos; no persisted data needs reversal.
