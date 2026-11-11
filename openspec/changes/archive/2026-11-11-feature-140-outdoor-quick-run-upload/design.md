# Design

## Context

See `proposal.md` for motivation, `specs/outdoor-quick-workout-upload/spec.md` for the quick-add behavior, and `specs/outdoor-quick-route-workout/spec.md` for the route-mode rule.

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
- Keep the route mode out of a dialog that cannot save it.
- Keep the walking button where the owner expects it — first in the row.

**Non-Goals:**

- New dialog components, server actions, database fields, or migrations.
- A separate "favorite shoes" concept.
- Quick-add buttons for other activity types.
- Restyling the unrelated `Add track` action.
- A route workout for any activity type but walking.

## Decisions

### 1. Dictionary entries plus a small per-activity-type visual map

Add the `running` entry to the English and Russian `quickWorkout.activities` maps. Add a small `QUICK_ACTIVITY_VISUALS` map in `TrackManagementPanel` keyed by the activity type `key`, carrying an icon and a button variant. The existing filter, dialog, title suggester, slug builder, and gear selection need no changes.

Unknown activity types keep the generic `Plus` icon and outline style, so adding a future wording entry still produces a usable button without another code change.

Alternative considered: dictionary entries only. Rejected because the owner wants the two buttons to be visually distinct, and the label alone is not enough.

Alternative considered: a dedicated running branch or component. Rejected because it duplicates the generic per-activity-type mechanism and would need a second copy for every future type.

### 2. Icons plus button variant for the distinction

- Walking: `Footprints` icon, default (primary) variant.
- Running: `Zap` icon, `outline` variant.

The icon names the activity; the variant tells the two apart at a glance. Walking keeps the primary variant it has today, so the page's established action does not lose its weight — the new running button is the secondary one. The `Add track` action stays primary with its `Plus` icon, and the running button is still identifiable by its own icon and label.

Alternative considered: `Activity` (a pulse line) for running. Rejected by the owner — it reads as a heart rate, while `Zap` names the speed.

Alternative considered: walking outline, running primary. Rejected by the owner — it demotes the established walk button, which is the page's main action.

Alternative considered: colour-only distinction. Rejected because it is less accessible and does not name the activity.

### 3. Reuse the existing per-activity-type gear preference

The running dialog preselects `ownerGearPreferences[runningActivityTypeId]`, exactly as walking does, and offers only gear whose activity-type set includes running.

Alternative considered: add a dedicated favorite-running-shoes field. Rejected because the preference model already expresses "preferred gear for this activity type" and a second model would fragment it.

### 4. Pin the running button in the existing capability spec

The generic requirement already says that any active type with a wording gets a button. Add concrete running scenarios rather than a new requirement, so the behavior stays in one place and the new button and its visual distinction are covered by validation.

Alternative considered: `skip_specs: true`. Rejected because the change is user-visible and the running button is worth pinning as an acceptance criterion.

### 5. The route mode stays a walking feature

The quick upload dialog is shared by every quick-add button, and the route mode that feature-146 added lives inside it. The route workout it creates is a walking workout: `createQuickRouteWorkout` refuses any activity type but walking. The dialog therefore renders the **Create with route** action and its source hint for walking only, and the running dialog offers the file mode alone.

Alternative considered: widen `createQuickRouteWorkout` to any activity type. Rejected — a route run is a different product decision, and the change stays a slice.

Alternative considered: leave the button visible and let the server refuse. Rejected — a button that always fails is worse than no button.

### 6. The walking button comes first

The activity types arrive from the database sorted by their English name, and `Running` sorts before `Walking`. The quick-add buttons are therefore rendered with walking first and the other types after it in that same alphabetical order, so the established action keeps the place the owner knows.

Alternative considered: the database order. Rejected by the owner — the secondary button would stand in front of the page's main one.

### 7. Pin the route-mode rule in its own capability

The walking-only rule belongs to `outdoor-quick-route-workout`, the capability that owns the route mode, not to the quick-add capability. The change therefore carries a second delta that modifies the route-mode requirement and adds a scenario for another activity type, and both deltas are synced together at archive time.

## Risks / Trade-offs

- [The `running` activity type is inactive in some environment] → The admin check task confirms it is active; activation stays an operational step, not a seed or migration change.
- [The walking button keeps its primary variant and changes only its icon] → The `Plus` icon becomes `Footprints`; the button's weight and its place in the row stay as they are, and the walking dialog itself is unchanged.
- [The route mode disappears for the running dialog] → Accepted by the owner: the route workout is a walking workout, and the server would refuse the save anyway.
- [Russian daypart adjectives must agree with the feminine noun `пробежка`] → The dictionary stores the complete adjective forms explicitly; the code never derives grammar.
- [A future activity type needs both a wording entry and a visual entry] → The fallback `Plus` icon and outline style keep the button usable until a visual entry is added.

## Migration Plan

None. Revert the dictionary entries, the visual map, the button order, and the route-mode block to remove the running button and restore the previous walking style.
