# Tasks

## 1. The model

- [ ] In `prisma/schema.prisma`, add the enum next to the other track enums (after `TrackTimeSource`, around line 245):

  ```prisma
  enum TrackKind {
    ROUTE
    TRAINING
  }
  ```

- [ ] In `model Track` (around lines 335–360), add the column next to the other track classifications:

  ```prisma
  kind                     TrackKind       @default(ROUTE)
  ```

- [ ] Add `@@index([userId, kind])` to `model Track`. Keep the existing `@@index([userId])` — it still serves the owner-wide list.
- [ ] Run `npx prisma generate` so `TrackKind` is exported from `generated/prisma/enums`.
- [ ] Create the migration: `npx prisma migrate dev --name add_track_kind`. The generated SQL should be exactly the three statements in `design.md` — `CREATE TYPE`, `ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT 'ROUTE'`, `CREATE INDEX`. If `migrate dev` reports "modified after applied", do **not** reset the database: query `SELECT * FROM "_prisma_migrations" WHERE finished_at IS NULL` first and clear the orphan row.

## 2. The data layer (`app/_data/tracks.ts`)

- [ ] Import `TrackKind` from `@/generated/prisma/enums` in the existing import block (lines 6–12).
- [ ] Add the two constants next to `DEFAULT_TRACK_STATUS` / `TRACK_STATUSES` (lines 146–147):

  ```ts
  const DEFAULT_TRACK_KIND: TrackKind = "ROUTE";
  const TRACK_KINDS = new Set<TrackKind>(["ROUTE", "TRAINING"]);
  ```

- [ ] `TrackActionValues` (lines 38–46): add `kind?: TrackKind;`.
- [ ] `getTrackData` (lines 185–218): destructure `kind`, normalize it to `DEFAULT_TRACK_KIND` when absent, throw `"Track kind is invalid"` when it is not in `TRACK_KINDS`, and return `kind: normalizedKind` in the data object. `createTrack` and `updateTrack` both spread that object into their Prisma write, so neither needs a separate edit — verify that is still true after the change.
- [ ] `CreateManualTrackInput` (lines 48–58): add `kind?: TrackKind;`.
- [ ] `createManualTrack` (line 995 onward): normalize and validate the kind the way the status is handled there — return `{ ok: false, code: "VALIDATION", message: "Track kind is invalid" }` for a value outside `TRACK_KINDS` — and write `kind: normalizedKind` in the `tx.track.create({ data: { … } })` row.
- [ ] `trackListSelect` (lines 272–315): add `kind: true`. `TrackListItem` derives from this select, so the type follows automatically.
- [ ] Do **not** touch `publicTrackSelect` or `PublicTrack` — the kind is a private classification and the public read path must not select it.
- [ ] Add `getOwnerWorkoutTracks()` next to `getAllTracks` (lines 455–464): the same owner-scoped query with `where: { userId, kind: "TRAINING" }`, the same `trackListSelect`, and the same ordering.

## 3. The shared track form (`components/admin-pages/tracks-admin-panel.tsx`)

- [ ] `formSchema` (lines 75–97): add `kind: z.enum(["ROUTE", "TRAINING"])`.
- [ ] Rename the module-level `defaultValues` constant to `TRACK_FORM_DEFAULTS` and add `kind: "ROUTE"` to it.
- [ ] Inside `TrackFormDialog`, derive the per-instance defaults:

  ```ts
  const defaultValues = useMemo(() => ({ ...TRACK_FORM_DEFAULTS, kind: defaultKind }), [defaultKind]);
  ```

  where `defaultKind` is a new prop of `TrackFormDialog` (default `"ROUTE"`).
- [ ] `useForm({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" })` — pass the derived `defaultValues`.
- [ ] `resetFormState` (lines 189–192): keep using the derived `defaultValues`, and add it to the `useCallback` dependency list.
- [ ] The prefill effect (lines 203–233): in the `track` branch add `kind: track.kind` to the `form.reset({ … })` call so editing a workout does not demote it; in the create branch keep `form.reset(defaultValues)` (now the derived one) and add `defaultValues` to the effect's dependency list.
- [ ] `renderTextFields` (line 469 onward): add a `Track kind` select to the same two-column grid, after the Slug field. Mirror the activity-type select's structure — `Select` + `FormControl` + `SelectTrigger` + `SelectValue` + `SelectContent` with two `SelectItem`s (`Route` → `"ROUTE"`, `Workout` → `"TRAINING"`). The value is `field.value`, the change handler is `field.onChange`.
- [ ] `onSubmit` (lines 299–307): add `kind: values.kind` to `trackPayload`, which covers both `createTrack` and `updateTrack`.
- [ ] The Place-on-map branch (lines 424–434): add `kind: values.kind` to the `createManualTrack` call.
- [ ] `TrackManagementPanel` (line 870): add a `defaultKind?: TrackKind` prop defaulting to `"ROUTE"`, pass it to `TrackFormDialog`.

## 4. The list column (`components/admin-pages/tracks-admin-columns.tsx`)

- [ ] Add a `Kind` column as the first column of `createTracksAdminColumns` (before the `Type` column at lines 49–57).
- [ ] The cell renders a `Badge`: `Workout` with `variant="secondary"` when `row.original.kind === "TRAINING"`, `Route` with `variant="outline"` otherwise.
- [ ] The header is the plain string `"Kind"` — matching the `"Type"` header in the same factory.

## 5. The `/my/workouts` page

- [ ] Create `app/(public)/my/workouts/page.tsx`, modeled on `app/(public)/my/tracks/page.tsx` (that file is 29 lines and is the exact template).
- [ ] `await requireAuth()` at the top of the page component; `export const dynamic = "force-dynamic";` and a `metadata` export built with `buildPageMetadata` — title `My workouts`, path `/my/workouts`.
- [ ] `Promise.all([getOwnerWorkoutTracks(), getActiveTrackActivityTypes()])`.
- [ ] Render `<PageLayout title="My workouts" contentWidth="wide" className="pt-6">` around `<TrackManagementPanel tracks={tracks} activityTypes={activityTypes} defaultKind="TRAINING" />`.

## 6. The nav entry (`components/blog-pages/navbar-user-menu.tsx`)

- [ ] Add a `My workouts` link next to the `My tracks` link (lines 68–73), pointing at `/my/workouts`, with the lucide `Dumbbell` icon. `Route` already marks the tracks entry; `Dumbbell` is the workout counterpart.
- [ ] Add `Dumbbell` to the file's lucide-react import.

## 7. Validate

- [ ] `npm run tsc` — must pass clean.
- [ ] `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/tracks-admin-columns.tsx components/blog-pages/navbar-user-menu.tsx --quiet` — these are outside `app/`, so the root lint script does not cover them. Run without `--quiet` too.
- [ ] `npm run lint`.
- [ ] `npx openspec validate feature-120-track-workout-kind`.
- [ ] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either.

## 8. Browser check

- [ ] `/my/tracks`: the table shows a `Kind` column; existing tracks read `Route`.
- [ ] `/my/tracks`: open a track's edit dialog — the `Track kind` select shows `Route`; change it to `Workout`, save, and confirm the row's badge flips to `Workout`.
- [ ] `/my/tracks`: create a track by uploading a GPX with the kind set to `Workout` — the track is created and reads as a workout.
- [ ] `/my/tracks`: create a track via the `Place on map` tab with the kind set to `Workout` — the track is created and reads as a workout.
- [ ] `/my/workouts`: reachable from the user menu; lists only the owner's workouts; the owner's routes do not appear.
- [ ] `/my/workouts`: the `Add track` dialog starts on `Workout`; saving without touching the select creates a workout.
- [ ] `/my/workouts`: a workout created there also appears in `/my/tracks` (the two views are the same records, filtered differently).
- [ ] `/my/workouts` as an anonymous visitor — the page requires authentication.
- [ ] A published workout's public track page shows no kind badge and no kind wording (the kind stays private).

## 9. Docs

- [ ] `openspec/backlog.md`: the `feature-120-track-workout-kind` row moves to `Done` when the change is implemented, and the row is removed from the table at archive time.
- [ ] `openspec/specs/outdoor-tracks/spec.md`: the requirements from `specs/outdoor-tracks/spec.md` in this change are merged into the live spec at archive time.
- [ ] `openspec/backlog.md`: the gear candidates are rewritten from footwear-only to generic gear, and a Strava-link candidate is added — both waiting on this model.

## Not in this change

- The "workouts are not part of trips" rule — a separate feature on top of this flag.
- The gear inventory (owner-owned items, one per track).
- The Strava activity link (a numeric activity id on the track).
- The admin-scope question on `/admin/tracks` — filed separately as `admin-tracks-lists-only-own-tracks`.
