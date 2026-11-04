# Design

## Context

`feature-132` already filters `/my/workouts` to one ISO week and renders that week in full without pagination. The panel holds the filtered `visibleTracks` array and the selected `IsoWeekRef`, so the numbers for a summary are available in memory. The workout table already computes an effective distance per row — recording mirror, then parsed GPX summary — and the summary must use exactly the same value, or the total will disagree with the column the owner is reading.

## Decisions

**Where the numbers come from.** The summary is derived from `visibleTracks` with a `useMemo`, not from a new query and not from the rendered page. The week view is not paginated today, so `visibleTracks` is the whole selected week; the count and the sum are therefore complete even if pagination returns to that view later.

**One distance definition.** The effective start / distance / duration accessors move out of `components/admin-pages/tracks-workout-columns.tsx` and `lib/track-iso-week.ts` into `lib/track-effective-values.ts`. Both the table cells and the summary call the same helper, so "the distance column shows 12.4 km in total" and "the week summary says 12.4 km" cannot drift apart. This is a pure extraction: the fallback chains stay byte-for-byte the same.

Approved during planning on 2026-11-03: the extraction is **in scope for this change and will be done as part of it**, not deferred. It is a pure internal refactor with no observable behavior change, which the feature-pool hybrid rule allows to ride along with the user-visible summary. Tasks 1.1–1.3 carry it, and the browser checklist must confirm the Distance column still renders and sorts as before.

**What counts as distance.** A workout counts toward the workout count whenever it is in the week. It counts toward the total only when its effective distance is a finite number. When no workout in the week has a distance, the summary reports "no distance recorded" instead of `0 m`, because zero would claim the owner moved nothing. A partially covered week still shows the sum, with the dialog noting how many workouts had no distance.

**Summary shape.** A small ghost button sits to the right of the week controls, inside the same left-hand toolbar group and only while `selectedWeek` is set: an icon, the count, and the formatted total. `formatTrackDistance` is reused, matching the table's `km` / `m` units. On narrow viewports the toolbar already wraps, so the summary wraps under the filter instead of forcing a horizontal scroll.

**Dialog.** Clicking the summary opens the existing `Dialog` with the selected week label (the same `formatIsoWeekRange` wording as the filter), the workout count, and the total distance. When some workouts have no parsed distance, a secondary line says how many were counted for distance. The dialog is read-only — `feature-136` will grow the detailed breakdown here.

**Localization.** New keys live in the `trips` namespace next to the existing `workoutWeek*` keys, in both `en` and `ru`. The count uses i18next plural keys (`_one` / `_other`, plus `_few` / `_many` for Russian) so "1 workout" and "3 workouts" both read correctly. Units stay as the table renders them today.

## Rejected alternatives

- *A server aggregate or endpoint.* The data is already loaded and the selected week is a small set; an extra round-trip would add latency and a second distance definition.
- *A floating badge over the table.* It would overlap rows and compete with the existing toolbar; the week filter is where the owner already looks.
- *Duplicating the distance fallback in the summary.* Two copies of the same chain is exactly how the column and the total drift apart; the shared helper is cheaper than the bug.
- *Showing the summary on `All time`.* There is no single week to describe, and aggregating the whole history is a different feature with different performance characteristics.
- *Localizing the units now.* The table renders `km` / `m` today; changing units only in the summary would make the two disagree. Unit localization is a cross-cutting change.
