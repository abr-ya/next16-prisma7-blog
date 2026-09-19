## ADDED Requirements

### Requirement: Map photo selection opens the existing trip photo viewer

The system SHALL let a visitor select a visibility-safe photo entry from a public trip map marker and open the existing trip photo viewer for that selected photo. The interaction SHALL preserve the existing full-photo access boundary.

#### Scenario: Signed-in visitor selects a single photo marker

- **WHEN** a signed-in visitor selects a map marker for one linked published photo
- **THEN** the trip photo viewer opens with that photo selected
- **AND** the viewer retains its existing navigation and details behavior

#### Scenario: Visitor selects a photo from a grouped marker

- **WHEN** a visitor opens a map marker representing multiple linked published photos at one coordinate
- **THEN** the popup makes each photo individually selectable by its existing visibility-safe title and preview
- **AND** selecting one follows the same viewer access behavior as a single marker

#### Scenario: Guest selects a map photo

- **WHEN** an anonymous visitor selects a single or grouped map-photo entry
- **THEN** the system explains that sign-in is required to view the full photo
- **AND** it does not expose a full-size image URL, bytes, or provider URL
