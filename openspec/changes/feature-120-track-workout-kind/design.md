# Design

## The model

One enum, one column, one index.

```prisma
enum TrackKind {
  ROUTE
  TRAINING
}
```

```prisma
model Track {
  // …
  kind                     TrackKind       @default(ROUTE)
  // …
  @@index([userId, kind])
}
```

**Why an enum and not a boolean `isTraining`.** A boolean answers "is this a workout" and nothing else. The first thing that happens to a boolean flag in a personal tracker is that a third state appears — a commute, a race, a commute-and-a-race — and the boolean is replaced by an enum anyway, with a data migration on top of it. `Track` already carries two enums (`TrackStatus`, `TrackTimeSource`), so the pattern and the precedent are both on this model.

**Why `ROUTE` and `TRAINING` are the two values.** `ROUTE` is what every existing track is, and it is what a track created inside a trip is. `TRAINING` is the routine-session case the owner asked for: a walk or a run in their own city, logged for its own sake.

**Why `ROUTE` is the default.** The column is `NOT NULL DEFAULT 'ROUTE'`, so every existing row backfills to a route without a data rewrite and without a single row needing to be touched. A track that nobody has classified yet is a route — that is also what a track attached to a trip is. Nothing about the migration is destructive.

**Why the `(userId, kind)` index.** The only query this feature adds is `WHERE userId = ? AND kind = 'TRAINING'`. The existing `@@index([userId])` serves the owner-wide list but cannot narrow by kind, and Postgres would have to filter the kind after the index scan. The composite index makes `/my/workouts` a direct index lookup. The pre-existing single-column `@@index([userId])` stays — it still serves `/my/tracks`.

### The migration

Additive, three statements, no data rewrite:

```sql
-- CreateEnum
CREATE TYPE "TrackKind" AS ENUM ('ROUTE', 'TRAINING');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN "kind" "TrackKind" NOT NULL DEFAULT 'ROUTE';

-- CreateIndex
CREATE INDEX "Track_userId_kind_idx" ON "Track"("userId", "kind");
```

The `DEFAULT` clause is what makes the `ALTER TABLE` safe on a table with existing rows: Postgres fills every existing row with `ROUTE` inside the same statement, and the default stays in the schema so a row created by any other writer still lands as a route.

## The server boundary

The kind is written through the same three server actions that already write the track's other editable columns. All three are `"use server"` actions in `app/_data/tracks.ts`, and all three are owner-scoped, so the kind inherits that ownership check for free — there is no new authorization path.

| Action | Change |
| --- | --- |
| `createTrack` | none — it spreads `getTrackData`'s return value into the Prisma write, so the new `kind` field flows through |
| `updateTrack` | none — same spread, into `prisma.track.update` |
| `createManualTrack` | adds `kind` to `CreateManualTrackInput`, validates it, and writes it on the `tx.track.create` row |
| `createTrackAndAttachToHike` (trip side) | **none** — a track created inside a trip is a route by construction |

### Validation

The validation mirrors the status validation already in the same file:

```ts
const DEFAULT_TRACK_KIND: TrackKind = "ROUTE";
const TRACK_KINDS = new Set<TrackKind>(["ROUTE", "TRAINING"]);
```

`getTrackData` throws `"Track kind is invalid"` for a value outside the set (it throws for a bad status the same way); `createManualTrack` returns `{ ok: false, code: "VALIDATION" }` for the same condition (it returns a result rather than throwing, the same way it treats a bad status). A missing kind is not an error — it is `ROUTE`.

Both paths therefore reject a kind that is neither `ROUTE` nor `TRAINING`, even though the client cannot produce one: the client sends the string from a fixed two-item select, and the server does not trust that.

### The list projection

`trackListSelect` gains `kind: true`. `TrackListItem` is derived from that select (`Prisma.TrackGetPayload`), so the type picks the new field up automatically and the column factory can read `row.original.kind` without a cast.

The **public** projection `publicTrackSelect` does **not** change, and neither does `PublicTrack`. That is the whole mechanism by which the kind stays private: the public read path never selects the column, so there is nothing to leak even if a future page wanted to render it.

## The form

One select in the shared track dialog, used by `/my/tracks`, `/admin/tracks`, and the new `/my/workouts`.

```
Track kind   [ Route ▾ ]   Route | Workout
```

It sits in the same two-column grid as Title, Activity type, and Slug — row 1 is Title | Activity type, row 2 is Slug | Track kind. It is a plain label with no translation key, matching its neighbours in that dialog ("Title", "Slug", "Activity type" are all untranslated strings in the same grid).

### The default kind is per-instance

`defaultValues` is currently a module-level constant used by three places in `TrackFormDialog`: the form's `useForm` defaults, the discard reset (`resetFormState`), and the create branch of the prefill effect. A per-page default kind means that constant cannot stay a module-level singleton — on `/my/workouts` a new track must start as `TRAINING`, everywhere else as `ROUTE`.

So the module constant becomes the base and the dialog derives its own:

```ts
const TRACK_FORM_DEFAULTS: TrackFormValues = { /* …existing fields… */, kind: "ROUTE" };

// inside TrackFormDialog
const defaultValues = useMemo(() => ({ ...TRACK_FORM_DEFAULTS, kind: defaultKind }), [defaultKind]);
```

`defaultKind` is a new prop on `TrackFormDialog` and on `TrackManagementPanel`, defaulting to `"ROUTE"`. Three call sites need the derived value threaded through: `useForm`'s `defaultValues`, `resetFormState` (its `useCallback` gains `defaultValues` in its dependency list), and the create branch of the prefill effect (`form.reset(defaultValues)` — the effect's dependency list gains `defaultValues` too).

### The edit path keeps the stored kind

The prefill effect already restores the saved row's values when the dialog opens on an existing track. The kind joins that `form.reset({...})` call as `kind: track.kind`. Without it, opening a workout in the edit dialog would silently show `Route` and saving would demote it — the classic "the form forgot what was stored" bug.

### Both creation paths carry it

`onSubmit` builds one `trackPayload` used by `createTrack` and `updateTrack`; the kind joins that object, so both writes pick it up from one edit. The Place-on-map branch calls `createManualTrack` separately and adds `kind: values.kind` there too.

## The list

A `Kind` column, first in the table, before `Type`:

```
Kind      Type          Title      GPX file   …
[Route]   [Running]     Morning…   run.gpx    …
[Workout] [Walking]     Evening…   walk.gpx   …
```

`Route` uses the `outline` badge variant and `Workout` uses `secondary`, so a workout reads differently from a route at a glance without introducing a new colour.

**Why a column and not a badge inside an existing cell.** The `GPX file` cell already carries the publication-status badge and the file size; the `Type` cell carries the activity-type badge. Putting the kind into either of them would put two different classifications in one cell, and the reader would have to know which badge is which. The table already has eight columns and scrolls; one more narrow badge column is cheaper than an ambiguity in every row.

**The trip-side dialog gets no kind control.** A track added to a trip from the trip page is a route — the trip *is* the journey. Adding the control there would suggest the owner can mark a trip's track as a workout, which the "workouts are not part of trips" rule will later contradict.

## The two pages

`/my/tracks` and `/my/workouts` are the same page with a different query and a different default.

```
/my/tracks     → getAllTracks()                  → all the owner's tracks,  default kind ROUTE
/my/workouts   → getOwnerWorkoutTracks()         → only kind = TRAINING,  default kind TRAINING
```

Both render the same `TrackManagementPanel`, so the table, the row actions, the delete confirmation, the parse and timezone actions, and the create/edit dialog are literally the same component. The only difference is the data and the `defaultKind` prop.

**Why a separate route rather than a filter on `/my/tracks`.** A filter would need a client-side toggle and a query parameter, and the panel would have to filter a list it already received in full. A separate route scopes the query in SQL, is bookmarkable, and gets its own default for new tracks — which is the behaviour the owner actually wants from the page ("I am here to log a workout, so start me in workout mode").

**Why `/my/workouts` is not admin-only and not public.** It is an owner view, exactly like `/my/tracks`: `requireAuth()` at the top of the page, an owner-scoped query underneath. Nothing about it is special-cased for administrators — an administrator who owns workouts sees their own, and only their own.

**The empty state** needs no new code. `DataTable` renders a single "No results." row when the list is empty, and the `Add track` button above the table stays available, so an owner with no workouts still has the create path in front of them.

## The nav entry

`components/blog-pages/navbar-user-menu.tsx` gains a `My workouts` link next to `My tracks`, with the lucide `Dumbbell` icon (`Route` already marks the tracks entry). It is a plain `NavigationMenuLink` in the same list — no new component, no new menu.

## Labels

| Where | Text |
| --- | --- |
| Enum values | `ROUTE`, `TRAINING` |
| Form label | `Track kind` |
| Form options | `Route`, `Workout` |
| Column header | `Kind` |
| Column values | `Route`, `Workout` |
| Page title | `My workouts` |
| Nav entry | `My workouts` |

`Workout` rather than `Training` in the UI: "training" is the thing you do, "workout" is the session you log. The page the owner asked for is "my workouts", and the nav entry, page title, badge, and option all use the same word.

## Risks

| Risk | Mitigation |
| --- | --- |
| Existing tracks become workouts | The column defaults to `ROUTE` and the migration backfills `ROUTE`; no row is reclassified |
| The public surface starts leaking the kind | `publicTrackSelect` and `PublicTrack` are not touched — the column is never selected on the public path |
| A trip-side track becomes a workout | The trip-side dialog has no kind control, and `createTrackAndAttachToHike` does not write a kind — the column default applies |
| Editing a workout demotes it to a route | The prefill effect restores `track.kind` into the form; the derived `defaultValues` only applies in the create branch |
| The admin panel's create flow starts creating workouts | `defaultKind` defaults to `"ROUTE"` on `TrackManagementPanel`; only the new page passes `TRAINING` |
| The new column breaks the admin table layout | The column holds one short badge; the table already scrolls horizontally at narrow widths |
| A kind outside the enum reaches the database | Both write paths validate against `TRACK_KINDS` before writing |
| The migration touches existing data | The `ALTER TABLE` only adds a column with a default; nothing is updated or deleted |

## Observations (not in this change)

- **`/admin/tracks` lists only the signed-in administrator's own tracks.** The admin page calls `getAllTracks()`, which filters by `userId` — the same owner-scoped helper `/my/tracks` uses. There is no admin-scoped variant. This predates the change and is filed separately as `admin-tracks-lists-only-own-tracks`; the kind column inherits the same scope, so on `/admin/tracks` it shows the administrator's own kinds.
- **The kind is the anchor for the two follow-ups.** The gear inventory (one gear item per track) and the Strava activity link both describe *a training session and the equipment it used* — the kind is what makes that model meaningful, and the "workouts are not part of trips" rule becomes expressible the moment the kind exists.
