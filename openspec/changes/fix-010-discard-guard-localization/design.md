# Design

## Context

### The hook today

`lib/use-discard-guarded-track-form.ts` is a `"use client"` module that owns the whole discard lifecycle: it tracks freshly uploaded file ids, decides whether a close needs a confirmation, runs the discard, and hands the dialog its copy. All of that copy is a literal:

```ts
// lib/use-discard-guarded-track-form.ts:136-153
const confirmDialogProps = {
  open: discardConfirmOpen,
  onOpenChange: setDiscardConfirmOpen,
  title: hasUnsavedUploads
    ? "Discard track and uploaded GPX?"
    : hasUnsavedPoints
      ? "Discard placed points?"
      : "Discard track changes?",
  description: hasUnsavedUploads
    ? "This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing."
    : hasUnsavedPoints
      ? "This form has unsaved changes and placed map points. Discarding will close the modal without saving them."
      : "This form has unsaved changes. Discarding will close the modal without saving them.",
  confirmLabel: hasUnsavedUploads ? "Discard and remove file" : "Discard changes",
  confirmVariant: "destructive" as const,
  isPending: isDiscarding,
  onConfirm: handleConfirmDiscard,
};
```

Ten literals in the file: three titles, three descriptions, two confirm labels, the success toast, and the error fallback.

### The three consumers

| Consumer | Surface | Its own copy |
| --- | --- | --- |
| `components/admin-pages/tracks-admin-panel.tsx` | admin track create/edit modal | `useT(tripsNamespace)` |
| `components/hike-pages/hike-track-contribution-form.tsx` | trip-side `Add track` dialog on `/trips/[slug]` | `useT(navigationNamespace)` with `trips:`-prefixed keys |
| `components/track-pages/quick-workout-upload-dialog.tsx` | quick workout upload dialog on `/my/workouts` | `useT(tripsNamespace)` |

All three render their labels from the `trips` namespace in the interface language. Only the guard is English — which is why the dialogs read as half-translated.

### The namespace is already shipped

`app/layout.tsx:35` loads all three namespaces for both supported languages and hands them to the client:

```ts
const resources = getResources(i18n, [navigationNamespace, guideNamespace, tripsNamespace], [...supportedLanguages]);
```

`trips` is therefore already on the client in `en` and `ru`. Nothing about the resource pipeline has to change.

`lib/track-row-actions.ts` is the precedent for reading it from `lib/`:

```ts
"use client";
import { useT } from "next-i18next/client";
import { tripsNamespace } from "@/app/i18n/settings";
// ...
const { t } = useT(tripsNamespace);
// ...
toast.success(t("trackMarkAsManualSuccess"));
```

The namespace-bound `t` resolves a plain key against `trips`.

### The error toast's dead fallback

```ts
// lib/use-discard-guarded-track-form.ts:122-133
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

The action's failure branch always returns a `message`, so `|| "Uploaded GPX file could not be removed"` can never be reached. The string the user actually reads on a failed discard is the action's English message:

```ts
// app/_actions/files.ts:77-84
return {
  success: false,
  message: isAdmin
    ? "An uploaded GPX file is no longer safe to discard."
    : "You can only discard GPX files you uploaded.",
};
```

Localizing the hook's fallback would change nothing. The hook's copy and the copy the user sees are two different sets of strings, and only the second one is reachable.

## Goals / Non-Goals

**Goals**

- The guard's title, description, confirm label, and outcome toasts render in the interface language on all three surfaces.
- The failure toast renders in the interface language too.
- The English text a user reads is exactly the text they read today.
- The guard's behavior is unchanged, branch for branch.

**Non-Goals**

- Rewording anything. The English strings move; the Russian strings are translations.
- Localizing `ConfirmDialog`'s shared `Cancel` default.
- Localizing the admin track panel's other English strings, or the "earlier uploaded GPX" cleanup path.
- Changing the hook's option set, the action's database behavior, or the shape of `confirmDialogProps`.

## Decisions

### Decision 1 — The copy lives in the `trips` namespace under `discardGuard.*`

A nested block, appended after `quickWorkout` in both locale files, keeping the two files parallel:

```jsonc
// app/i18n/locales/en/trips.json
"discardGuard": {
  "titleWithFile": "Discard track and uploaded GPX?",
  "titleWithPoints": "Discard placed points?",
  "titleChanges": "Discard track changes?",
  "descriptionWithFile": "This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing.",
  "descriptionWithPoints": "This form has unsaved changes and placed map points. Discarding will close the modal without saving them.",
  "descriptionChanges": "This form has unsaved changes. Discarding will close the modal without saving them.",
  "confirmWithFile": "Discard and remove file",
  "confirmChanges": "Discard changes",
  "successToast": "Uploaded GPX file discarded",
  "errorNotSafe": "An uploaded GPX file is no longer safe to discard.",
  "errorNotOwner": "You can only discard GPX files you uploaded."
}
```

`quickWorkout.*` is the precedent for a nested block; the two error keys round the block out to the full set of strings the guard can show.

The Russian translation, reviewed and approved before this change:

| Key | `ru` |
| --- | --- |
| `titleWithFile` | Отменить трек и загруженный GPX-файл? |
| `titleWithPoints` | Отменить расставленные точки? |
| `titleChanges` | Отменить изменения трека? |
| `descriptionWithFile` | В форме есть несохранённые изменения и загруженный GPX-файл. При отмене несохранённый GPX-файл будет помечен на удаление перед закрытием. |
| `descriptionWithPoints` | В форме есть несохранённые изменения и расставленные на карте точки. При отмене окно закроется без их сохранения. |
| `descriptionChanges` | В форме есть несохранённые изменения. При отмене окно закроется без их сохранения. |
| `confirmWithFile` | Отменить и удалить файл |
| `confirmChanges` | Отменить изменения |
| `successToast` | Загруженный GPX-файл удалён |
| `errorNotSafe` | Загруженный GPX-файл больше нельзя удалить. |
| `errorNotOwner` | Можно удалять только те GPX-файлы, которые вы загрузили. |

No key uses a placeholder, so none of them can hit the single-brace interpolation bug that four older `trips` keys carry.

### Decision 2 — The hook reads the copy itself

The hook is already `"use client"`, so it can call `useT` directly, exactly as `lib/track-row-actions.ts` does:

```ts
"use client";

import { useT } from "next-i18next/client";
// ...
import { tripsNamespace } from "@/app/i18n/settings";

export const useDiscardGuardedTrackForm = ({ /* unchanged options */ }) => {
  const { t } = useT(tripsNamespace);
  // ...
```

Two consumers bind `t` to `trips` already, and the third binds to `navigation` and reaches across with `trips:`-prefixed keys. The hook binding its own `t` to `trips` keeps the guard's keys unprefixed and local to the hook.

`handleConfirmDiscard` is a `useCallback`, so `t` joins its dependency array:

```ts
}, [closeWithoutGuard, discardableFileAssetIds, t]);
```

`confirmDialogProps` is a plain object literal, recomputed on every render, so it needs no memo and no dependency array.

The hook's doc comment gets a line noting that it reads its copy from the `trips` namespace, so the next reader does not go looking for the strings in the file.

### Decision 3 — The failure toast is localized through an error code

The action gains a machine-readable `code` on its failure result, alongside the existing `message`:

```ts
// app/_actions/files.ts
if (unsafeFileId) {
  return {
    success: false,
    message: isAdmin
      ? "An uploaded GPX file is no longer safe to discard."
      : "You can only discard GPX files you uploaded.",
    code: isAdmin ? "NOT_SAFE" : "NOT_OWNER",
  };
}
```

The hook maps the code to a key:

```ts
if (!result.success) {
  toast.error(t(result.code === "NOT_OWNER" ? "discardGuard.errorNotOwner" : "discardGuard.errorNotSafe"));
  return;
}
```

`message` stays in the action's result. Its other caller — `cleanupSupersededUploads` in `components/admin-pages/tracks-admin-panel.tsx`, the separate "earlier uploaded GPX" cleanup on the save path — keeps reading `result.message` and is not touched by this change.

The English text of the failure toast is therefore byte-identical to today's: `errorNotSafe` and `errorNotOwner` are the action's two English messages, copied into the locale file. What changes is that the hook stops inheriting them as an opaque server string and starts choosing them by code.

The hook's unreachable fallback `"Uploaded GPX file could not be removed"` is dropped — there is nothing left for it to fall back to.

### Decision 4 — The action needs an explicit return type

Today the action's inferred return type widens `success: true` / `success: false` to `boolean`, so `result.success` does not discriminate and `result.code` is not reachable on the failure branch. The action gets a declared result type:

```ts
export type DiscardTrackGpxErrorCode = "NOT_SAFE" | "NOT_OWNER";

type DiscardTrackGpxResult =
  | { success: true; message: string }
  | { success: false; message: string; code: DiscardTrackGpxErrorCode };
```

With it, `if (!result.success)` narrows to the failure arm and `result.code` is `"NOT_SAFE" | "NOT_OWNER"` — so `result.code === "NOT_OWNER"` type-checks and the mapping above is exhaustive by construction.

### Decision 5 — The `Cancel` button stays English

The guard's dialog uses `ConfirmDialog`'s default cancel label, which seventeen other call sites share. The hook does not pass `cancelLabel`, and this change does not add one: localizing that default is a sweep over `components/common/confirm-dialog.tsx` and its other consumers, and the guard's own strings are the scope here.

The consequence is that a Russian guard dialog reads «Отменить трек и загруженный GPX-файл?» with a `Cancel` button next to «Отменить и удалить файл». That mix is deliberate and bounded, and it is a known follow-up rather than an oversight.

### Decision 6 — No change at the three call sites

None of the three passes a string to the hook today, so none of them changes. The guard's copy lives in one place, and the three surfaces pick it up together — which is the point of the shared hook.

## Risks

| Risk | Mitigation |
| --- | --- |
| The English text drifts while the copy moves | Every `en` value is the current literal, character for character; `errorNotSafe` and `errorNotOwner` are the action's own two messages |
| The Russian wording changes what the guard asks | The wording is a translation of the English, approved before the change lands; no branch of the guard is reworded |
| The failure toast shows a different string than today | `errorNotSafe` / `errorNotOwner` are the action's existing English messages, copied verbatim |
| `result.code` is not reachable after the action change | The action gets an explicit discriminated return type (Decision 4), and `npm run tsc` catches a widening that defeats it |
| The second caller of the action breaks on the added field | The field is additive; `cleanupSupersededUploads` reads `result.message` and is unchanged |
| A stale `useCallback` dependency keeps an old `t` in the closure | `t` is added to `handleConfirmDiscard`'s dependency array |
| The hook's `useT` call fails outside the i18n provider | All three consumers render under the root layout, which provides the provider; `lib/track-row-actions.ts` is the same shape and already ships |
| The guard's behavior changes while the copy moves | Only the string expressions change; the ternaries, the branches, the toast placement, and the call order are untouched |
| The `Cancel` button reads as an oversight | Documented in Decision 5 and in the proposal's non-goals as a separate sweep |
| A key is added to one locale file and not the other | Both files get the same eleven keys in the same order, appended after `quickWorkout` |

## Migration Plan

None. No Prisma schema change, no migration, no data change, no route change. The change is a locale-file addition, a hook rewrite of its string expressions, and one additive field plus one type annotation on an existing server action.

## Open Questions

None. The two decisions that needed an owner — whether to localize the shared `Cancel` default, and how the failure toast becomes localizable — are settled: the `Cancel` default stays as it is, and the failure toast goes through an error code on the action.
