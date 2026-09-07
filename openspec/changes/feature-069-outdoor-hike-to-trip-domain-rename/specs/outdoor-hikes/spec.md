## ADDED Requirements

### Requirement: Legacy hike terminology remains URL-compatible

The system SHALL preserve legacy hike URLs as compatibility entry points while the primary user-facing domain is Trips.

#### Scenario: Existing hike link remains usable

- **WHEN** a visitor follows an existing `/hikes/[slug]` link
- **THEN** the system permanently redirects to `/trips/[slug]`
- **AND** it does not expose a duplicate public detail page at the legacy URL

