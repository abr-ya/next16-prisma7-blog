# Design

## Context

See `proposal.md` for motivation. The public trip contribution button delegates to the reusable `PhotoUploadDialog`, which currently always advertises and accumulates up to the endpoint-wide three-image maximum. The administrator photo form is separate. `normalizePhotoInput` and the UploadThing endpoint deliberately accept one to three images for the established `Photo` model.

## Goals / Non-Goals

**Goals:**

- Make the public trip contribution UI intentionally single-image first.
- Keep grouped photos possible through an obvious affirmative choice.
- Preserve all existing server authorization and data-integrity checks.

**Non-Goals:**

- Add a persisted opt-in field, alter existing photos, or reduce the underlying three-image model.
- Apply this UI policy to administrator create/edit workflows.
- Treat the checkbox as an authorization boundary; the existing server-side one-to-three validation remains authoritative.

## Decisions

### 1. Scope the opt-in to the trip contribution dialog invocation

`PhotoUploadDialog` will receive an optional image-count policy used only by `HikePhotoContributionButton`. Its default remains the current one-to-three behavior, so the administrator form is unchanged.

This isolates the product rule to the requested public trip flow and avoids duplicating the shared title, description, preview, removal, and upload UI.

Alternative: change the global photo maximum to one unless enabled. Rejected because existing admin workflows and persisted photo records legitimately use grouped images.

### 2. Use a client-only, unchecked multi-image checkbox

The contribution dialog will present an unchecked control such as “Add more images to this photo (up to 3).” Before it is selected, UI copy and selection capacity are capped at one; after it is selected, they use the existing maximum of three. This preference describes the current submission only and is not stored or sent to the contribution action.

If more than one image is already selected, the UI will not silently discard them when multi-image mode is turned off; it will require the contributor to remove extra images before returning to single-image mode.

Alternative: silently retain or discard surplus images on opt-out. Rejected because either outcome makes the checkbox misleading or risks accidental data loss.

### 3. Retain endpoint and action validation unchanged

The UploadThing endpoint and `normalizePhotoInput` remain configured for one through three images. The client policy prevents accidental multi-image selection in the trip dialog, while the existing action continues to validate ownership, file eligibility, duplicate bindings, authorization, quota, and atomic creation.

Alternative: add a boolean to the action and reject multi-image submissions without it. Rejected because a UI preference is not a security or domain invariant, and it would unnecessarily change a stable action contract.

## Risks / Trade-offs

- [Risk] A shared dialog change could alter other callers → Mitigation: make the new policy opt-in at the call site and confirm the administrator caller retains its current maximum.
- [Risk] The upload widget may expose its endpoint maximum independently of surrounding UI → Mitigation: configure the contribution invocation's client-side selection constraint where supported and verify both one-image default and checked multi-image flows manually.
- [Risk] Uploaded but unsubmitted assets can remain under the existing file lifecycle → Mitigation: do not change that lifecycle in this UI-only slice; preserve the current asset eligibility and cleanup behavior.

## Migration Plan

1. Deploy the client-side public-dialog policy with no schema or stored-data migration.
2. Verify an authorized contributor can add one image without opt-in and two/three only after opt-in; verify the admin photo form still accepts its existing one-to-three range.
3. Roll back by removing the call-site policy; existing photos, endpoint settings, and action behavior remain valid.
