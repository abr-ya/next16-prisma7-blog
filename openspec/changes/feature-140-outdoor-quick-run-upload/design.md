# Design

## Context

See `proposal.md` for motivation and `specs/outdoor-quick-workout-upload/spec.md` for the required behavior.

The quick-add path is already activity-type-parameterized:

- `TrackManagementPanel` renders one button per active activity type that has a `quickWorkout.activities.<key>.addLabel` entry.
- `QuickWorkoutUploadDialog` receives the activity type and derives the title noun, the daypart wording, and the slug base from its `key`.
- `createQuickWorkout` validates the activity type, parses the file, and stores the workout with the activity type, the derived slug, and the recording timezone.
- The preferred gear is read per activity type from the existing owner preferences (feature-124), and the gear list is filtered by the same activity-type compatibility rule.

The seeded `running` activity type already exists; its dictionary entry is missing, and the panel currently renders every quick-add button with the same `Plus` icon and primary style.

## Goals / Non-Goals

**Goals:**

- Make the running quick-add button appear through the existing mechanism.
- Make walking and running unmistakably different at a glance.
- Keep the wording, title grammar, and slug behavior consistent with walking.

**Non-Goals:**

- New dialog components, server actions, database fields, or migrations.
- A separate "favorite shoes" concept.
- Quick-add buttons for other activity types.
- Restyling the unrelated `Add track` action.

## Decisions

### 1. Dictionary entries plus a small per-activity-type visual map

Add the `running` entry to the English and Russian `quickWorkout.activities` maps. Add a small `QUICK_ACTIVITY_VISUALS` map in `TrackManagementPanel` keyed by the activity type `key`, carrying an icon and a button variant. The existing filter, dialog, title suggester, slug builder, and gear selection need no changes.

Unknown activity types keep the generic `Plus` icon and outline style, so adding a future wording entry still produces a usable button without another code change.

Alternative considered: dictionary entries only. Rejected because the owner wants the two buttons to be visually distinct, and the label alone is not enough.

Alternative considered: a dedicated running branch or component. Rejected because it duplicates the generic per-activity-type mechanism and would need a second copy for every future type.

### 2. Icons plus button variant for the distinction

- Walking: `Footprints` icon, `outline` variant.
- Running: `Activity` icon, default (primary) variant.

The icon names the activity; the variant gives the stronger contrast the owner asked for. The `Add track` action stays primary with its `Plus` icon, and the running button is still identifiable by its own icon and label.

Alternative considered: different icons only. Rejected by the owner in favour of the stronger variant contrast.

Alternative considered: colour-only distinction. Rejected because it is less accessible and does not name the activity.

### 3. Reuse the existing per-activity-type gear preference

The running dialog preselects `ownerGearPreferences[runningActivityTypeId]`, exactly as walking does, and offers only gear whose activity-type set includes running.

Alternative considered: add a dedicated favorite-running-shoes field. Rejected because the preference model already expresses "preferred gear for this activity type" and a second model would fragment it.

### 4. Pin the running button in the existing capability spec

The generic requirement already says that any active type with a wording gets a button. Add concrete running scenarios rather than a new requirement, so the behavior stays in one place and the new button and its visual distinction are covered by validation.

Alternative considered: `skip_specs: true`. Rejected because the change is user-visible and the running button is worth pinning as an acceptance criterion.

## Risks / Trade-offs

- [The `running` activity type is inactive in some environment] → The admin check task confirms it is active; activation stays an operational step, not a seed or migration change.
- [Changing the walking button to outline alters an existing surface] → Accepted by the owner as the cost of telling the two actions apart; the walking dialog itself is unchanged.
- [Russian daypart adjectives must agree with the feminine noun `пробежка`] → The dictionary stores the complete adjective forms explicitly; the code never derives grammar.
- [A future activity type needs both a wording entry and a visual entry] → The fallback `Plus` icon and outline style keep the button usable until a visual entry is added.

## Migration Plan

None. Revert the dictionary entries and the visual map to remove the running button and restore the previous walking style.
