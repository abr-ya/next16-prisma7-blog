# Tasks

## 1. Workout columns

- [x] 1.1 Make the **Title** header sortable with `SortableHeader`; keep its text comparison.
- [x] 1.2 Update the **Started** accessor from feature-129 to return `undefined` when no start exists and set `sortUndefined: "last"` so blank starts stay at the bottom in both directions.
- [x] 1.3 Add an accessor for **Distance** that returns the parsed `distanceMeters` or `undefined`, make the header sortable, and sort numerically.
- [x] 1.4 Add an accessor for **Duration** that returns the stored `recordingDurationSeconds` or the parsed summary duration, or `undefined`; make the header sortable and sort numerically. Keep the accessor's fallback chain identical to the cell's.
- [x] 1.5 Keep **Type** unsortable: revert its header to plain text and remove the accessor, leaving the activity-type badge informational.
- [x] 1.6 Confirm the default `started desc` from feature-129 is unchanged, the short column set has no new columns, and the timezone badge, type badge, and row actions stay unsortable.

## 2. Validation

- [x] 2.1 `npm run tsc` — expect no type errors.
- [x] 2.2 `npx eslint components/admin-pages/tracks-workout-columns.tsx --quiet` — expect no errors.
- [x] 2.3 `npm run lint` — expect no errors.
- [x] 2.4 `npx openspec validate feature-131-my-workouts-sortable-columns --strict` — expect the change to validate.
- [x] 2.5 `npm run build` — the owner ran the production build locally on 2026-11-02; it passed.

## 3. Browser check (the owner's)

- [x] 3.1 Open `/my/workouts` and confirm **Title**, **Started**, **Distance**, and **Duration** show sort controls, while **Type**, timezone, and actions do not.
- [x] 3.2 Sort **Distance** ascending and descending and confirm `9 km` sorts before `10 km`, and workouts without a distance stay last in both directions.
- [x] 3.3 Sort **Duration** the same way and confirm the numeric order and last-place blanks.
- [x] 3.4 Confirm **Type** has no sort control and still renders only the classification badge.
- [x] 3.5 Clear every sort and confirm the rows return to the page-supplied order and the neutral glyphs.
