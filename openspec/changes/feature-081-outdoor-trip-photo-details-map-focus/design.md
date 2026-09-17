## Context

The authenticated large-photo viewer calls an `onFocusMap` callback and then closes itself. The trip media component stores that coordinate and the Leaflet map already flies to it, but the map is rendered above the gallery and is neither scrolled into view nor focused. See `proposal.md` for the user-facing problem and the modified map requirement for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Make a successful photo-details map action reveal the existing map and move focus to it predictably.
- Preserve current coordinate eligibility, all-days map behavior during coordinate focus, and Leaflet map-layer visibility.
- Keep focus management compatible with keyboard and assistive-technology navigation.

**Non-Goals:**

- Changing map data, marker grouping, day-filter rules, map zoom policy, photo access policy, or Leaflet dependencies.
- Adding a map action when there is no rendered map surface or no accepted coordinate.

## Decisions

1. Give the existing trip map section a stable DOM reference and a programmatic focus target. The trip-media parent owns both the map and gallery, so it can scroll and focus without routing state or a new client/server boundary. A route hash or a global event is unnecessary and would leave stale navigation state.
2. On `Show on map`, keep the existing coordinate state update, close the dialog, then scroll the map section into view and focus its labelled map container. The map's existing focus-coordinate input continues to force the all-days layer view and Leaflet fly-to behavior. Sequencing the close before focus avoids leaving focus trapped in an unmounted dialog.
3. Render the action only when the viewer is authorized, an accepted coordinate exists, and the trip currently renders a map. This preserves current visibility and prevents a misleading control in marker-less/no-map cases.

## Risks / Trade-offs

- [Scroll happens before the dialog has finished closing] → Close the dialog first and schedule the scroll/focus after the state transition using the client render lifecycle.
- [Programmatic focus steals focus without context] → Focus a labelled, keyboard-reachable map wrapper after scrolling, not an arbitrary page element or Leaflet internals.
- [Repeated focus on the same coordinate does not trigger a map update] → Preserve an explicit action callback so map navigation is performed for every selection, rather than relying on a changed coordinate value alone.

## Migration Plan

No schema, data, route, or deployment migration is required. Rollback consists of removing the new scroll/focus behavior and, if it cannot be made reliable, removing the map action instead of leaving a misleading control.
