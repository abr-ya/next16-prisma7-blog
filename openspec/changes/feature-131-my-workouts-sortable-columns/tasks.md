# Tasks

## 1. Workout columns

- [ ] 1.1 Make the **Title** header sortable with `SortableHeader`; keep its text comparison.
- [ ] 1.2 Update the **Started** accessor from feature-129 to return `undefined` when no start exists and set `sortUndefined: "last"` so blank starts stay at the bottom in both directions.
- [ ] 1.3 Add an accessor for **Distance** that returns the parsed `distanceMeters` or `undefined`, make the header sortable, and sort numerically.
- [ ] 1.4 Add an accessor for **Duration** that returns the stored `recordingDurationSeconds` or the parsed summary duration, or `undefined`; make the header sortable and sort numerically. Keep the accessor's fallback chain identical to the cell's.
- [ ] 1.5 Add an accessor for **Type** that returns the activity-type name in the active language, or the unclassified label; make the header sortable.
- [ ] 1.6 Confirm the default `started desc` from feature-129 is unchanged, the short column set has no new columns, and the timezone badge and row actions stay unsortable.

## 2. Validation

- [ ] 2.1 `npm run tsc` — expect no type errors.
- [ ] 2.2 `npx eslint components/admin-pages/tracks-workout-columns.tsx --quiet` — expect no errors.
- [ ] 2.3 `npm run lint` — expect no errors.
- [ ] 2.4 `npx openspec validate feature-131-my-workouts-sortable-columns --strict` — expect the change to validate.
- [ ] 2.5 `npm run build` — the user runs the build locally; the agent records the result here.

## 3. Browser check (the owner's)

- [ ] 3.1 Open `/my/workouts` and confirm **Title**, **Started**, **Distance**, **Duration**, and **Type** all show sort controls, while timezone and actions do not.
- [ ] 3.2 Sort **Distance** ascending and descending and confirm `9 km` sorts before `10 km`, and workouts without a distance stay last in both directions.
- [ ] 3.3 Sort **Duration** the same way and confirm the numeric order and last-place blanks.
- [ ] 3.4 Sort **Type** and confirm the order matches the visible type names, with unclassified rows grouped.
- [ ] 3.5 Clear every sort and confirm the rows return to the page-supplied order and the neutral glyphs.
