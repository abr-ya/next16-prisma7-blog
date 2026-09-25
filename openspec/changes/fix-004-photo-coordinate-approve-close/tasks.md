# Tasks

## 1. Tighten the `onChanged` callback type in `HikePhotoCoordinateReview`

- [ ] 1.1 In [components/hike-pages/hike-photo-coordinate-review.tsx](../../components/hike-pages/hike-photo-coordinate-review.tsx), add a local type `type ChangeReason = "approved" | "refresh";` near the top of the file.
- [ ] 1.2 Change the `HikePhotoCoordinateReview` props: `onChanged: () => void` → `onChanged: (reason: ChangeReason) => void`.
- [ ] 1.3 In `confirmTimezone`, replace the success-path `onChanged();` with `onChanged("refresh");`.
- [ ] 1.4 In `approve`, replace the success-path `onChanged();` with `onChanged("approved");`.
- [ ] 1.5 In `reject`, replace the success-path `onChanged();` with `onChanged("refresh");`.
- [ ] 1.6 Change the `ManualCoordinateForm` props: `onChanged: () => void` → `onChanged: (reason: ChangeReason) => void`.
- [ ] 1.7 In `ManualCoordinateForm.submit`, replace the success-path `onChanged();` with `onChanged("approved");`.
- [ ] 1.8 Leave the four `try/catch` blocks untouched: the error branch already toasts and skips the callback, which is the required behavior on failure.

## 2. Close the dialog in the gallery on `"approved"`

- [ ] 2.1 In [components/hike-pages/hike-photo-gallery.tsx](../../components/hike-pages/hike-photo-gallery.tsx), locate the `<HikePhotoCoordinateReview ... />` instance inside the coordinate-review `<Dialog>`.
- [ ] 2.2 Replace the inline `onChanged` handler:

  ```tsx
  onChanged={() => startTransition(() => router.refresh())}
  ```

  with the branched form:

  ```tsx
  onChanged={(reason) => {
    startTransition(() => {
      router.refresh();
      if (reason === "approved") setCoordinatePhotoId(null);
    });
  }}
  ```

  Keep the existing `startTransition` wrap so the refresh stays non-blocking; `setCoordinatePhotoId(null)` shares the same transition.

## 3. Validation

- [ ] 3.1 Run `npm run tsc` and confirm zero TypeScript errors.
- [ ] 3.2 Run `npx eslint components/hike-pages/hike-photo-coordinate-review.tsx components/hike-pages/hike-photo-gallery.tsx --quiet` and confirm zero warnings.
- [ ] 3.3 Run `npm run build` and confirm `/trips/[slug]` still appears in the build output.
- [ ] 3.4 Manual smoke check in a local browser against a trip with a linked photo that has at least one coordinate candidate: open the photo viewer's "GPX coordinates" dialog, click `Approve` on an automatic candidate, and confirm the dialog closes while the trip map refreshes. Re-open the dialog and click `Save manual correction` (enter a valid lat/lng), and confirm the same close-on-success behavior. Re-open the dialog, click `Reject map coordinate`, and confirm the dialog stays open and the trip map refreshes. Re-open the dialog, click `Confirm timezone` (when applicable) and confirm the dialog stays open. Force a server-action error (e.g. by temporarily passing an invalid candidate id) and confirm the dialog stays open with the error toast. Restore the candidate id afterwards.

## 4. Backlog and documentation bookkeeping

- [ ] 4.1 In [openspec/backlog.md](../../backlog.md), remove the `outdoor-photo-coordinate-approve-close-dialog` row from the P1 Soon table.
- [ ] 4.2 Append a `fix-004 | fix-004-photo-coordinate-approve-close | outdoor/maps-photos | ...` row to the Fix History table in [openspec/feature-history.md](../../feature-history.md), summarising the typed `onChanged` reason and the gallery's `setCoordinatePhotoId(null)` close-on-approved behavior.
- [ ] 4.3 Run `openspec validate fix-004-photo-coordinate-approve-close --strict` and confirm the change is ready to archive.