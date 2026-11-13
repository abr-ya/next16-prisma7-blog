# Tasks

## 1. Data model and migration

- [x] 1.1 Add the `FavoritePlace` model to `prisma/schema.prisma` — `id`, `name`, `latitude Float`, `longitude Float`, `userId` with a `User` relation and `onDelete: Cascade`, `createdAt`, `updatedAt`, and `@@index([userId])` — plus the `User.favoritePlaces` relation; verify `npx prisma generate` succeeds and the generated client exposes `prisma.favoritePlace`.
- [x] 1.2 Create the migration `prisma/migrations/<timestamp>_add_favorite_places/migration.sql` with `npx prisma migrate diff --from-schema <the applied schema> --to-schema prisma/schema.prisma --script` and apply it with `npx prisma migrate deploy` — `npx prisma migrate dev` refuses to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. **Do not reset the database.** Verify that the `FavoritePlace` table and its owner index exist and that no existing table was altered and no existing row changed.

## 2. Owner-scoped data layer

- [x] 2.1 Add `app/_data/favorite-places.ts` with `"use server"` at the top and the four helpers `getOwnerFavoritePlaces`, `createFavoritePlace`, `updateFavoritePlace` (rename), and `deleteFavoritePlace`; resolve the owner from `requireActionUser()`, read every mutated row with the owner in the `where` clause (`{ id, userId }`), and answer with `{ ok: true, ... }` or `{ ok: false, code, message }` with the code union `VALIDATION | NOT_FOUND | UNAUTHORIZED` and English messages; verify by reading the module that no helper accepts an owner id from the client.
- [x] 2.2 Validate the name (non-empty after trimming, at most 120 characters) and the coordinate (latitude within -90 to 90, longitude within -180 to 180) before the write; verify that a save with an empty name, an over-long name, or an out-of-range coordinate is refused with `VALIDATION` and stores nothing.
- [x] 2.3 Revalidate `/my/places` after every mutation; verify the path is revalidated on create, rename, and delete.
- [x] 2.4 Handle the `AuthorizationError` of a signed-out call in every mutation the way `app/_data/gear.ts` does; verify an unauthenticated call answers `UNAUTHORIZED` instead of throwing.

## 3. The saved places page

- [x] 3.1 Add the server page `app/(public)/my/places/page.tsx` mirroring `/my/gear`: `initServerI18next`, `export const dynamic = "force-dynamic"`, `buildPageMetadata`, `await requireAuth()`, the owner's places read, and `<PageLayout title={t("pages.myPlaces")} contentWidth="wide">` around the panel; verify the page requires authentication and renders the owner's list only.
- [x] 3.2 Add the client panel `components/admin-pages/favorite-places-panel.tsx`: a `DataTable` of the owner's places — name, coordinates, creation date — with rename and delete, `useDeleteRowConfirm` and `ConfirmDialog` for the delete, toasts for the outcome, and the gear panel's empty-state block; verify the empty state renders when the owner has no places.
- [x] 3.3 Add the place form: a name field and one coordinate dropped on the map, with the map wrapping the existing `TrackEditorMap` so a click replaces the single coordinate and the marker can be dragged before saving; verify the form shows the picked coordinate and refuses to save without a name.
- [x] 3.4 Add the `/my/places` entry to the user menu in `components/blog-pages/navbar-user-menu.tsx`; verify the entry appears for a signed-in owner and leads to the new page.

## 4. The saved-place picker in the route form

- [x] 4.1 In `components/track-pages/route-form-dialog.tsx`, render the saved-place picker in create mode above the map; the list comes from the owner-scoped read when the dialog opens, and the control is not rendered when the owner has no saved places — the form points the owner at the saved places page instead; verify the picker lists only the owner's places and offers no place of another owner.
- [x] 4.2 On a pick, prepend the chosen coordinate to the form's point list and remount the editor with a new `key` — the pattern of `components/track-pages/route-geometry-dialog.tsx` — so the place becomes point `#1` and the already-placed points keep their order after it; verify the point list shows the place first and the distance preview accounts for it.
- [x] 4.3 Give the `RouteFormDialog` in `components/track-pages/draft-workout-dialog.tsx` a `key` (or clear its points on open) so a picked place does not survive the close and reopen of the draft dialog; verify the route form opens with an empty point list every time.
- [x] 4.4 Verify that the route is stored exactly as before — a GPX file built from the points, no saved-place reference, and no start-point field on the route — and that the route's start is the first point of its geometry.

## 5. Strings and navigation copy

- [x] 5.1 Add the English and Russian strings: `workspace.pages.myPlaces` for the page title, `navigation.myPlaces` for the user-menu entry, and the panel, form, and picker labels in the `workspace` namespace; verify both locale files parse and the new keys resolve on the page, in the menu, and in the picker.
- [x] 5.2 Leave the route dialog's and the gear panel's existing hardcoded English as it is; verify no English string of the new surfaces is left untranslated in the Russian locale.

## 6. Verification

- [x] 6.1 Run `npm run tsc`, targeted ESLint on the changed files, and `openspec validate "feature-148-outdoor-favorite-places" --strict`, and confirm all pass.
- [x] 6.2 Ask the owner to run `npm run build` locally and confirm it passes.

## 7. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as a candidate in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 7.1 — and are not tasks of this change anymore:

- `/my/places` opens for the signed-in owner, lists only their own places, and shows the empty state before the first place is added.
- A place is added with a name and a coordinate dropped on the map, and the map marker can be dragged before saving.
- A place is renamed and deleted; a delete asks for a confirmation, and the list drops the row afterwards.
- In the manual route form, the picker lists the owner's places; picking one makes it point `#1`, the map moves to it, and the points placed afterwards follow it.
- A route created from a picked place stores geometry only, and the route's start is its first point.
- An owner with no saved places sees no picker in the route form and is pointed at the saved places page.
- Another owner's place never appears in the picker or on the saved places page.

- [x] 7.1 File the deferred browser checks as a candidate in `openspec/backlog.md` rather than leave them open here.

## Workflow follow-up

- Sync the `outdoor-favorite-places` and `outdoor-routes` deltas into the main specs and archive the change after review.
- Add the completed `feature-148-outdoor-favorite-places` entry to the feature history on archive.
