## Why

On a trip detail page, the authorized photo-contribution action appears after all page content, separating it from the photos it adds to and making the placement feel unintuitive. Move the action into the Photos section header so it is discovered where contributors expect it.

## What Changes

- Place the existing authorized `Add photo` control beside the `Photos` heading on published trip detail pages.
- Preserve the existing upload dialog, server-side authorization, one-to-three-image submission, quota feedback, and post-submit refresh behavior.
- Remove the separate bottom-of-page photo-contribution panel.
- Keep the Photos heading and eligible contribution action available even when the trip currently has no linked photos.

### Non-goals

- Change contributor eligibility, owner/admin override, quotas, file validation, photo data, or publication behavior.
- Redesign the photo gallery, upload dialog, or trip page outside this control relocation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-photos`: Change the public trip photo-contribution affordance from a separate page-bottom panel to the Photos section header.

## Impact

- Affected public route: `/trips/[slug]` (with legacy `/hikes/[slug]` continuing to redirect).
- Affected public components: trip media/photo gallery and the existing photo-contribution form/dialog composition.
- No data model, migration, API, dependency, or admin-surface changes.
