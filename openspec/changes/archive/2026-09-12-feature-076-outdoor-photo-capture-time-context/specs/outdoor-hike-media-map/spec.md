## ADDED Requirements

### Requirement: Track-time candidate review shows comparable timestamp context
The system SHALL show authorized coordinate reviewers the photo's stored UTC capture instant and timezone evidence together with each source track's labelled recording-time range in its persisted recording timezone. The review SHALL preserve the existing absolute-time matching result and candidate placement behavior.

#### Scenario: Photo appears before a same-day track start

- **WHEN** an authorized reviewer opens a previous-day-finish candidate for a photo whose stored UTC instant is earlier than the first linked track's UTC start on that capture day
- **THEN** the review shows the photo UTC instant, its timezone evidence, and the source track range with its persisted timezone label
- **AND** the review retains the previous-day-finish candidate and explains the boundary without comparing unlabelled viewer-local clocks

#### Scenario: Photo appears inside a track window

- **WHEN** an authorized reviewer opens an inside-track candidate
- **THEN** the review shows the same labelled photo and track timestamp context
- **AND** it retains the existing inside-track candidate and interpolation behavior
