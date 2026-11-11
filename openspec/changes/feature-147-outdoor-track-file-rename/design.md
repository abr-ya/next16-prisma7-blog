# Design

## Context

The file name is stored, not derived. `FileAsset.name` is written from the uploaded file's own name ([app/api/uploadthing/core.ts:70](../../../app/api/uploadthing/core.ts#L70)) and shown in two places: the file card of the public track page ([app/(public)/tracks/[slug]/page.tsx:229](../../../app/(public)/tracks/%5Bslug%5D/page.tsx#L229)) and the `Name` column of `/admin/files`.

The download route serves the file through an application-owned URL and takes the download name from the stored name:

```ts
headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(fileAsset.name)}"`);
```
— [app/files/[fileId]/download/route.ts:33](../../../app/files/%5BfileId%5D/download/route.ts#L33).

So the stored name is already the name the owner receives, and the file's bytes live under a provider key that the application never has to expose.

## Goals / Non-Goals

**Goals:**

- Let the owner give the file of their own workout a name they chose.
- Keep the rename a display-name write: no provider operation, no new URL, no change to the file's identity.
- Keep the control where the name is already visible: the public track page.
- Keep a shared file out of reach: a workout that borrows a route's file must not be able to rename it.

**Non-Goals:**

- Renaming a route's own file, or renaming any file from `/admin/files` or the track edit dialog.
- A provider-side rename, a new storage object, or a new download URL.
- A second, owner-only name.
- Changing the upload, parse, download, or retirement paths.
- A database field or a migration.

## Decisions

### 1. The rename writes the display name only

The action updates `FileAsset.name` and nothing else. The provider object, `fileKey`, and `url` stay as they are.

This is what makes the feature cheap and safe. The download URL is built from the file asset's identity (`/files/{id}/download`), not from the provider key, so it does not change; the download name is read from the stored name, so it follows the rename; and nothing calls the provider's rename API, so no object is moved and no stored URL can go stale.

Alternative considered: rename the provider object too (`UTApi.renameFiles`). Rejected — it changes the object's key, which forces the stored URL to change in the same step, and it buys nothing: the application never shows the provider name to anyone.

### 2. The control lives on the public track page, next to the name

The file card already shows `track.file.name` next to a file icon. The control is an icon-only button right after it, and the owner-only flag is computed the same way the neighbouring **Clean up points** control computes its own ([app/(public)/tracks/[slug]/page.tsx:250](../../../app/(public)/tracks/%5Bslug%5D/page.tsx#L250)).

Alternative considered: an owner-only detail page. Rejected for this slice — that page does not exist, and its candidate (`outdoor-my-track-detail-page`) is a larger piece of work. The public page is where the name is shown today, so the control goes there.

### 3. Only a workout's own file can be renamed

A workout created from a route borrows the route's file: the same file asset backs the route library entry and every workout built on that route. Renaming it from one workout page would silently change it for all of them.

The rule is therefore the same one `canCleanPoints` already uses — the track must have no `routeId` — and it is enforced on the server, not only by hiding the control: the action refuses a track whose geometry belongs to a route.

Alternative considered: allow it and show a warning. Rejected — the owner would rename one workout's file and see another workout's file renamed too.

### 4. One name for every viewer

The stored name is what the public page sends to every visitor, anonymous ones included. The rename replaces it for everyone.

The alternative — a separate owner-only name — would need a second field on the file asset and a rule for which name each audience sees. The owner accepted the simpler model: a file name on a published workout is public, like the title and the description.

### 5. The action takes the track, not the file

The action is called with the track id and the new base name. From the track it can read the owner, the `routeId`, and the file asset in one query, so the ownership rule and the route rule are checked where the data is, and a caller cannot aim the action at an arbitrary file asset.

The action stores the base name plus `.gpx`. The suffix is applied on the server rather than only in the dialog, so the stored name keeps its shape no matter who calls the action.

### 6. The dialog edits the base name with a fixed suffix

The field holds the base name; the `.gpx` suffix is rendered next to it and is not editable. The owner therefore cannot accidentally produce a file without the extension, and cannot add a second one.

The name is normalized before it is stored: trimmed, stripped of path separators and control characters, and refused when what is left is empty. A name is a label, not a path.

### 7. The copy follows the neighbouring control

The modal and its messages are localized in the `trips` namespace, English and Russian, the same way the **Clean up points** control on the same page is ([components/track-pages/track-point-cleanup-dialog.tsx:45](../../../components/track-pages/track-point-cleanup-dialog.tsx#L45)). The page's own static text stays English for now — localizing it is a separate slice.

### 8. Both surfaces that show the name are revalidated

The write revalidates the track page and `/admin/files`, so the public page and the admin list never disagree about the name.

## Risks / Trade-offs

- [The new name is visible to every viewer of the track] → Accepted by the owner: the name of a published workout's file is public, like its title.
- [A renamed file changes the name of future downloads] → Expected — that is the point. Copies the owner already downloaded keep their old name.
- [A workout that borrows a route's file cannot be renamed] → The route's file belongs to the route library; renaming it from a workout page is refused on the server, and the control is not offered.
- [The admin file list sorts and searches by the name] → A rename moves the row, which is the expected consequence of a name change.
- [A name is used in a `Content-Disposition` header] → The stored name is percent-encoded there already, so a name with spaces or non-ASCII characters is served correctly.

## Migration Plan

None. Reverting the action and the control restores the previous behaviour; a name that was changed stays as the owner left it.
