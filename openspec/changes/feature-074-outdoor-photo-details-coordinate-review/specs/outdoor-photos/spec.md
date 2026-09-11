## ADDED Requirements

### Requirement: Owner-or-admin can refresh linked photo EXIF metadata
The system SHALL allow only the owner of a photo linked to a published trip or an administrator to request initial or repeat EXIF metadata extraction from that trip's photo card. The server SHALL revalidate the session, published trip/photo linkage, and actor authority before invoking the existing extraction and persistence workflow. It SHALL preserve the existing metadata and extraction formats and SHALL refresh the authorized detail projection after completion.

#### Scenario: Owner refreshes missing metadata
- **WHEN** the owner of a linked published photo requests EXIF extraction from its trip card
- **THEN** the system invokes the existing extraction workflow for that photo
- **AND** the resulting capture summary and any valid direct GPS data become available only through the existing authorized detail boundary

#### Scenario: Unauthorized actor requests EXIF extraction
- **WHEN** a trip creator who does not own the photo, accepted participant, anonymous visitor, or unrelated signed-in user directly requests linked-photo EXIF extraction
- **THEN** the system rejects the request
- **AND** it does not alter the photo metadata

### Requirement: Owner-or-admin can review a trip photo coordinate
The system SHALL allow only the photo owner or an administrator to review the existing track-time coordinate candidates for a photo linked to that trip from the `GPX coordinates` card modal. The system SHALL retain the current requirement that only a reviewed approved or manually corrected inferred coordinate becomes public-map eligible, and SHALL reject direct attempts by any other actor.

#### Scenario: Photo owner approves a candidate
- **WHEN** the owner of a photo linked to a trip approves a resolvable track-time candidate from that photo's details view
- **THEN** the system applies the existing approval rules and persists the candidate provenance, confidence, and accepted coordinate
- **AND** the result becomes eligible for the trip map only when the photo and trip are otherwise public-eligible

#### Scenario: Photo owner manually corrects a candidate
- **WHEN** the owner of the linked photo supplies a valid manual latitude and longitude while approving a candidate
- **THEN** the system records the coordinate as a reviewed manual correction under the existing coordinate-source model
- **AND** it preserves the original photo and extracted EXIF metadata

#### Scenario: Unauthorized actor attempts coordinate review
- **WHEN** an anonymous visitor, unrelated signed-in user, trip creator who does not own the photo, or accepted participant attempts to approve, reject, or manually correct a candidate
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
