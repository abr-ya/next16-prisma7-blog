## ADDED Requirements

### Requirement: Track time summaries support matching spikes before full timelines exist

The system SHALL allow an admin track-time matching spike to use stored track recording time ranges when available, while recognizing that simplified map geometry without per-point timestamps is insufficient for precise along-track interpolation.

#### Scenario: Track has a usable recording time range

- **WHEN** a linked track has successful parse metadata with `time.start` and `time.end`
- **THEN** an admin matching spike may use that range to classify whether a photo capture time falls inside the track window
- **AND** the spike SHALL NOT claim precise along-track interpolation unless timestamped route points are available

#### Scenario: Track has geometry but no usable timestamps

- **WHEN** a linked track has map-ready geometry but no usable recording time summary
- **THEN** the track can remain map-renderable
- **AND** it is not treated as usable for timestamp-based photo matching candidates in the spike

#### Scenario: Future timeline retention remains a follow-up

- **WHEN** precise photo placement along a route is required
- **THEN** a later change may retain timestamped trackpoint context beyond start/end summary
- **AND** public hike pages still MUST NOT reparse raw GPX during normal rendering once that data is stored
