# Tasks

## 1. The model

- [x] In `prisma/schema.prisma`, add the enum next to the other track enums (after `TrackTimeSource`, around line 245):

  ```prisma
  enum TrackKind {
    ROUTE
    TRAINING
  }
  ```

- [x] In `model Track` (around lines 335–360), add the column next to the other track classifications:

  ```prisma
  kind                     TrackKind       @default(ROUTE)
  ```

- [x] Add `@@index([userId, kind])` to `model Track`. Keep the existing `@@index([userId])` — it still serves the owner-wide list.
- [x] Run `npx prisma generate` so `TrackKind` is exported from `generated/prisma/enums`.
- [x] Create the migration `prisma/migrations/20261024120000_add_track_kind/migration.sql`. The SQL was generated with `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` and matches the three statements in `design.md` — `CREATE TYPE`, `ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT 'ROUTE'`, `CREATE INDEX`.
  - `npx prisma migrate dev` refused to run: the older migration `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied (file sha256 `3cc99e8e…` vs the recorded `819bf594…`), and `migrate dev` offered to reset the database. **No reset was performed.** The migration was applied with `npx prisma migrate deploy`, which does not re-verify the checksums of already-applied migrations. The checksum drift itself is still open — see `admin-tracks-lists-only-own-tracks`'s sibling note in the backlog and the migration-drift follow-up.

## 2. The data layer (`app/_data/tracks.ts`)

- [x] Import `TrackKind` from `@/generated/prisma/enums` in the existing import block (lines 6–12).
- [x] Add the two constants next to `DEFAULT_TRACK_STATUS` / `TRACK_STATUSES` (lines 146–147):

  ```ts
  const DEFAULT_TRACK_KIND: TrackKind = "ROUTE";
  const TRACK_KINDS = new Set<TrackKind>(["ROUTE", "TRAINING"]);
  ```

- [x] `TrackActionValues` (lines 38–46): add `kind?: TrackKind;`.
- [x] `getTrackData` (lines 185–218): destructure `kind`, normalize it to `DEFAULT_TRACK_KIND` when absent, throw `"Track kind is invalid"` when it is not in `TRACK_KINDS`, and return `kind: normalizedKind` in the data object. `createTrack` and `updateTrack` both spread that object into their Prisma write, so neither needed a separate edit — confirmed after the change.
- [x] `CreateManualTrackInput` (lines 48–58): add `kind?: TrackKind;`.
- [x] `createManualTrack` (line 995 onward): normalize and validate the kind the way the status is handled there — return `{ ok: false, code: "VALIDATION", message: "Track kind is invalid" }` for a value outside `TRACK_KINDS` — and write `kind: normalizedKind` in the `tx.track.create({ data: { … } })` row.
- [x] `trackListSelect` (lines 272–315): add `kind: true`. `TrackListItem` derives from this select, so the type follows automatically.
- [x] Do **not** touch `publicTrackSelect` or `PublicTrack` — the kind is a private classification and the public read path must not select it.
- [x] Add `getOwnerWorkoutTracks()` next to `getAllTracks` (lines 455–464): the same owner-scoped query with `where: { userId, kind: "TRAINING" }`, the same `trackListSelect`, and the same ordering.
- [x] One extra guard beyond the plan: `updateTrack` writes the kind **only when the caller sends one** (`kind: undefined` means "leave unchanged" in a Prisma update). An update path that does not know about the column must not silently demote a workout back to a route.

## 3. The shared track form (`components/admin-pages/tracks-admin-panel.tsx`)

- [x] `formSchema` (lines 75–97): add `kind: z.enum(["ROUTE", "TRAINING"])`.
- [x] Rename the module-level `defaultValues` constant to `TRACK_FORM_DEFAULTS` and add `kind: "ROUTE"` to it.
- [x] Inside `TrackFormDialog`, derive the per-instance defaults:

  ```ts
  const defaultValues = useMemo(() => ({ ...TRACK_FORM_DEFAULTS, kind: defaultKind }), [defaultKind]);
  ```

  where `defaultKind` is a new prop of `TrackFormDialog` (default `"ROUTE"`).
- [x] `useForm({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" })` — pass the derived `defaultValues`.
- [x] `resetFormState` (lines 189–192): keep using the derived `defaultValues`, and add it to the `useCallback` dependency list.
- [x] The prefill effect (lines 203–233): in the `track` branch add `kind: track.kind` to the `form.reset({ … })` call so editing a workout does not demote it; in the create branch keep `form.reset(defaultValues)` (now the derived one) and add `defaultValues` to the effect's dependency list.
- [x] `renderTextFields` (line 469 onward): add a `Track kind` select to the same two-column grid, after the Slug field. Mirror the activity-type select's structure — `Select` + `FormControl` + `SelectTrigger` + `SelectValue` + `SelectContent` with two `SelectItem`s (`Route` → `"ROUTE"`, `Workout` → `"TRAINING"`). The value is `field.value`, the change handler is `field.onChange`.
- [x] `onSubmit` (lines 299–307): add `kind: values.kind` to `trackPayload`, which covers both `createTrack` and `updateTrack`.
- [x] The Place-on-map branch (lines 424–434): add `kind: values.kind` to the `createManualTrack` call.
- [x] `TrackManagementPanel` (line 870): add a `defaultKind?: TrackKind` prop defaulting to `"ROUTE"`, pass it to `TrackFormDialog`.

## 4. The list column (`components/admin-pages/tracks-admin-columns.tsx`)

- [x] Add a `Kind` column as the first column of `createTracksAdminColumns` (before the `Type` column at lines 49–57).
- [x] The cell renders a `Badge`: `Workout` with `variant="secondary"` when `row.original.kind === "TRAINING"`, `Route` with `variant="outline"` otherwise.
- [x] The header is the plain string `"Kind"` — matching the `"Type"` header in the same factory.

## 5. The `/my/workouts` page

- [x] Create `app/(public)/my/workouts/page.tsx`, modeled on `app/(public)/my/tracks/page.tsx` (that file is 29 lines and is the exact template).
- [x] `await requireAuth()` at the top of the page component; `export const dynamic = "force-dynamic";` and a `metadata` export built with `buildPageMetadata` — title `My workouts`, path `/my/workouts`.
- [x] `Promise.all([getOwnerWorkoutTracks(), getActiveTrackActivityTypes()])`.
- [x] Render `<PageLayout title="My workouts" contentWidth="wide" className="pt-6">` around `<TrackManagementPanel tracks={tracks} activityTypes={activityTypes} defaultKind="TRAINING" />`.

## 6. The nav entry (`components/blog-pages/navbar-user-menu.tsx`)

- [x] Add a `My workouts` link next to the `My tracks` link (lines 68–73), pointing at `/my/workouts`, with the lucide `Dumbbell` icon. `Route` already marks the tracks entry; `Dumbbell` is the workout counterpart.
- [x] Add `Dumbbell` to the file's lucide-react import.

## 7. Validate

- [x] `npm run tsc` — passes clean.
- [x] `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/tracks-admin-columns.tsx components/blog-pages/navbar-user-menu.tsx "app/(public)/my/workouts/page.tsx"` — clean. The only warning is `react-refresh/only-export-components` on the new page, which the existing `/my/tracks` page produces identically (it also exports `metadata`).
- [x] `npm run lint`.
- [x] `npx openspec validate feature-120-track-workout-kind` — valid.
- [ ] `npm run build` — the user runs the build; not run by the agent.

## 8. Browser check

Verified by the user on 2026-10-24:

- [x] `/my/tracks`: open a track's edit dialog — the `Track kind` select shows the stored kind; change it to `Workout`, save, and the row's badge flips to `Workout`. The round-trip back to `Route` works the same way.

The remaining checks were deferred and filed as `outdoor-track-workout-kind-manual-qa` in `openspec/backlog.md`:

- [ ] `/my/tracks`: the `Kind` column renders and existing tracks read `Route`.
- [ ] `/my/tracks`: create a track by uploading a GPX with the kind set to `Workout` — the track is created and reads as a workout.
- [ ] `/my/tracks`: create a track via the `Place on map` tab with the kind set to `Workout` — the track is created and reads as a workout.
- [ ] `/my/workouts`: reachable from the user menu; lists only the owner's workouts; the owner's routes do not appear.
- [ ] `/my/workouts`: the `Add track` dialog starts on `Workout`; saving without touching the select creates a workout.
- [ ] `/my/workouts`: a workout created there also appears in `/my/tracks` (the two views are the same records, filtered differently).
- [ ] `/my/workouts` as an anonymous visitor — the page requires authentication.
- [ ] A published workout's public track page shows no kind badge and no kind wording (the kind stays private).

## 9. Docs

- [x] `openspec/backlog.md`: the `feature-120-track-workout-kind` row is set to `In Progress` and removed from the table at archive time.
- [x] `openspec/backlog.md`: the gear candidates are rewritten from footwear-only to generic gear, and a Strava-link candidate is added — both waiting on this model.
- [x] `openspec/backlog.md`: the deferred browser checks are filed as `outdoor-track-workout-kind-manual-qa`.
- [x] `openspec/specs/outdoor-tracks/spec.md`: the requirements from `specs/outdoor-tracks/spec.md` in this change are merged into the live spec at archive time.

## Not in this change

- The "workouts are not part of trips" rule — a separate feature on top of this flag.
- The gear inventory (owner-owned items, one per track).
- The Strava activity link (a numeric activity id on the track).
- The admin-scope question on `/admin/tracks` — filed separately as `admin-tracks-lists-only-own-tracks`.
- The checksum drift on `20261013211113_feature_112_outdoor_track_creation_public_metadata` — pre-existing, left alone.
