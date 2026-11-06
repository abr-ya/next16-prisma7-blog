# Spec Delta

## ADDED Requirements

### Requirement: Owner can remove bad points from a saved track

The public track detail page SHALL offer an owner-only **Clean up points** action when the track owns its GPX file and the viewer is the track owner. The action SHALL open a modal showing the track on a map and, when the GPX carries timestamps, a speed chart. The owner SHALL be able to select a single point by clicking it and a contiguous range by dragging on the speed chart, see which points are selected and how many, and save the cleanup. Saving SHALL rewrite the stored GPX without dropping elevation, timestamps, or unrelated GPX content, replace the track's file asset, retire the previous asset as `PENDING_DELETE`, and re-parse the metadata so distance, point count, map line, and timeline match the new file.

#### Scenario: Owner opens the cleanup action

- **WHEN** the track owner views a published or draft track that owns its GPX file
- **THEN** the page shows the Clean up points action
- **AND** activating it opens the cleanup modal with the track line and, when timestamps exist, the speed chart

#### Scenario: Track without timestamps

- **WHEN** the owner opens cleanup for a track whose GPX has no timestamps
- **THEN** the modal shows the map and selectable points
- **AND** it explains that the speed chart is unavailable instead of drawing an empty or zero chart

#### Scenario: Select and save a single point

- **WHEN** the owner clicks one point and saves
- **THEN** that point and the hidden GPX points within the radius and time window are removed
- **AND** the modal reports how many points were selected before saving

#### Scenario: Select and save a range

- **WHEN** the owner drags a range on the speed chart and saves
- **THEN** every GPX point whose index falls inside that range is removed
- **AND** points outside the range remain in their original order

#### Scenario: Rewrite preserves the rest of the GPX

- **WHEN** a cleanup removes points
- **THEN** the remaining points keep their elevation, timestamps, and any vendor extension content
- **AND** the rewritten file still passes GPX validation

#### Scenario: Metadata reflects the cleanup

- **WHEN** the rewritten file is saved successfully
- **THEN** the track's distance, point count, map geometry, and timeline are re-parsed from the new file
- **AND** the previous file asset is retired and no longer served as the track's GPX

#### Scenario: Cleanup would leave too few points

- **WHEN** the selection would leave fewer than two usable points
- **THEN** the save is rejected with an explanatory message
- **AND** the track keeps its existing GPX unchanged

#### Scenario: Route-based and foreign tracks are protected

- **WHEN** a track's geometry belongs to a route, or the viewer is not its owner
- **THEN** the cleanup action is not offered
- **AND** a direct save request for that track is rejected without changing any file

#### Scenario: The file changed while the modal was open

- **WHEN** the track's file asset differs from the one the modal loaded
- **THEN** the save is rejected with a reload message
- **AND** neither file nor metadata is changed

#### Scenario: Save failure keeps the track intact

- **WHEN** the rewritten GPX cannot be uploaded or the database swap fails
- **THEN** the track keeps its previous file and metadata
- **AND** the owner sees an error instead of a success state

#### Scenario: Cleanup is readable by assistive technology

- **WHEN** the modal is read by a screen reader
- **THEN** the speed chart exposes the same per-point values through a text alternative
- **AND** the selection summary names how many points are marked
