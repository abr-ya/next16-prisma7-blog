## ADDED Requirements

### Requirement: Authorized users can review a trip photo coordinate from photo details
The system SHALL allow the photo owner, the trip creator, and an administrator to review the existing track-time coordinate candidates for a photo linked to that trip from the photo details view. The system SHALL retain the current requirement that only a reviewed approved or manually corrected inferred coordinate becomes public-map eligible, and SHALL reject direct attempts by any other actor.

#### Scenario: Photo owner approves a candidate
- **WHEN** the owner of a photo linked to a trip approves a resolvable track-time candidate from that photo's details view
- **THEN** the system applies the existing approval rules and persists the candidate provenance, confidence, and accepted coordinate
- **AND** the result becomes eligible for the trip map only when the photo and trip are otherwise public-eligible

#### Scenario: Trip creator manually corrects a candidate
- **WHEN** the creator of the linked trip supplies a valid manual latitude and longitude while approving a candidate
- **THEN** the system records the coordinate as a reviewed manual correction under the existing coordinate-source model
- **AND** it preserves the original photo and extracted EXIF metadata

#### Scenario: Unauthorized actor attempts coordinate review
- **WHEN** an anonymous visitor, unrelated signed-in user, or a participant who does not own the photo attempts to approve, reject, or manually correct a candidate
- **THEN** the system rejects the request
- **AND** it does not alter the photo coordinate or review state

### Requirement: Photo detail metadata distinguishes accepted coordinate state
The system SHALL expose an authorized photo-detail view with the current metadata state without treating a failed extraction, unreviewed inference, missing capture time, or unavailable track timeline as a coordinate. Coordinate review controls SHALL explain why a candidate cannot be automatically resolved and SHALL preserve the existing manual-correction path for authorized reviewers.

#### Scenario: Candidate cannot resolve automatically
- **WHEN** an authorized reviewer opens a photo with a capture time but no usable timed track timeline
- **THEN** the details view identifies that no automatic coordinate is available
- **AND** it allows an authorized reviewer to use the existing valid manual latitude/longitude correction path

#### Scenario: Metadata extraction failed or is absent
- **WHEN** an authorized viewer opens details for a photo with missing or failed metadata extraction
- **THEN** the view shows an unavailable metadata state without exposing internal extraction errors to ordinary viewers
- **AND** it does not offer a fabricated coordinate or candidate result
