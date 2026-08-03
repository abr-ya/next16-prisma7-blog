## MODIFIED Requirements

### Requirement: Reusable comment UI contract

The system SHALL provide a normalized comment list item contract for shared comment UI and target-specific adapters.

#### Scenario: Runtime contract is available to implementation code

- **WHEN** shared comment foundation code is implemented
- **THEN** the system SHALL provide a reusable runtime comment list item contract
- **AND** the contract SHALL include comment id, content, serialized creation timestamp, author display data, and target metadata

#### Scenario: Existing video comments normalize to shared contract

- **WHEN** public video comments are prepared for UI consumption
- **THEN** target-specific helpers SHALL be able to normalize those comments into the shared comment list item contract
- **AND** each normalized video comment SHALL include a target link to its public video detail page
