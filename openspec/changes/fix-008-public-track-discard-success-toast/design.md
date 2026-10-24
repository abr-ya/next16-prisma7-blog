# Design

## Depends on `refactor-003-discard-guarded-track-form`

This change edits the shared hook that `refactor-003-discard-guarded-track-form` introduces: it removes an option from it and hardcodes a toast. The refactor has to land first.

The order matters for the pool rules, not just for the code. `refactor-003` is only a valid `refactor-XXX` change if it contains no user-visible behavior change; adding the toast inside its commit would forfeit that. So the refactor lands first with the toast still an option, and this change converges it afterwards.

## The code today

Before `refactor-003`, the two forms each carried their own copy of the discard handler, and they differed in exactly one visible way:

```ts
// tracks-admin-panel.tsx — admin form
toast.success("Uploaded GPX file discarded");

// hike-track-contribution-form.tsx — public form
// (no success toast at all)
```

After `refactor-003`, the shared hook carries the difference as an option:

```ts
/** Success toast after a successful discard. Omit for no success toast. */
discardedMsg?: string;
```

```ts
if (discardedMsg) {
  toast.success(discardedMsg);
}
```

The admin form passes `discardedMsg: "Uploaded GPX file discarded"`; the public form passes nothing.

## The change

**1. In `lib/use-discard-guarded-track-form.ts`** — drop the option and hardcode the wording:

```ts
startDiscarding(async () => {
  const result = await markDiscardedTrackGpxFileAssetsPendingDelete(fileIdsToDiscard);

  if (!result.success) {
    toast.error(result.message || "Uploaded GPX file could not be removed");
    return;
  }

  toast.success("Uploaded GPX file discarded");
  closeWithoutGuard();
});
```

`discardedMsg` is removed from `DiscardGuardedTrackFormOptions` and from the hook's destructured parameter list.

**2. In `components/admin-pages/tracks-admin-panel.tsx`** — remove `discardedMsg: "Uploaded GPX file discarded"` from the hook call. The admin's behavior is unchanged: same toast, same place, same moment.

**3. In `components/hike-pages/hike-track-contribution-form.tsx`** — no change. The public form gains the toast through the hook.

After this, the hook's options are `savedFileAssetId`, `hasUnsavedChanges`, `hasUnsavedPoints`, `resetFormState`, `onOpenChange` — of which two are empty on the public side and one carries a per-form dirty term. The success toast is no longer a divergence between the two forms.

## The wording

`"Uploaded GPX file discarded"` — the admin form's existing string. It names the action (the file was discarded) and the object (the uploaded GPX file), and mentions neither the modal nor the form, so it reads the same for a trip creator as for an administrator.

No second string is introduced. Two spellings for one behavior would recreate the divergence this change removes.

## Why the toast stays inside the file branch

The toast fires only inside the `fileIdsToDiscard.length > 0` path — the branch that actually marks at least one uploaded file for deletion. A discard that only resets form fields ("Discard track changes?") shows no toast, and must not: "Uploaded GPX file discarded" would be false there.

The `fileIdsToDiscard.length === 0` early return above it stays exactly as it is.

## The failure path is untouched

If the action fails, the error toast shows and the modal stays open. The success toast must not fire on that path, and it cannot: the error branch returns before it.

## The hook's doc comment needs an edit

`refactor-003` left the hook's doc comment saying "The two forms guard different things and toast different messages, so the differences are options rather than a unified behavior." After this change the two forms toast the same message, so that sentence is stale and must be corrected — the remaining differences are the per-form parameters, not the toast.

## What is left in the hook after this change

| Option | Admin | Public | Why it stays |
| --- | --- | --- | --- |
| `savedFileAssetId` | the edited row's file | empty | the admin must not delete the persisted file |
| `hasUnsavedChanges` | `formState.isDirty` | `isDirty && tab === "upload"` | each form's submit path uses different form values |
| `hasUnsavedPoints` | staged map points | empty | only the admin can place points |
| `resetFormState` | clears points + form | clears form | the admin has extra staged state |
| `onOpenChange` | the admin dialog | the trip dialog | each wraps its own dialog |

Five options, three of them carrying a real per-form difference. That is the floor for a shared hook over two different forms — see `refactor-003`'s design for why the dirty term is not drift.

## Risks

| Risk | Mitigation |
| --- | --- |
| The toast fires on a discard that removed no file | It stays inside the `fileIdsToDiscard.length > 0` branch; the early return above it is untouched |
| The admin form loses or duplicates its toast | Only the option argument disappears; the `toast.success(...)` call moves from conditional to unconditional, and the admin path always had a non-empty `discardedMsg` |
| The toast appears before the modal closes | The call order stays `toast.success` → `closeWithoutGuard`, exactly as in the admin form today |
| A success toast on the error path | The error branch returns before the toast; unchanged |
| The fix lands inside the refactor's commit and forfeits the refactor pool | The refactor commits first; this change is a separate commit and a separate numbered change |
| The public form's toast duplicates another one | The public form's own `toast` calls are on the attach and submit paths, not the discard path — confirmed in `refactor-003` |
