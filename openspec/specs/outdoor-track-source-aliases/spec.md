# outdoor-track-source-aliases Specification

## Purpose

Defines an owner-scoped store for personal names that replace raw GPX source strings, and the read-only page where the owner sees those names before editing and display resolution arrive.

## Requirements

### Requirement: Source aliases are stored per owner and source kind

The system SHALL store source aliases in a table owned by one user, with a kind (`APP` or `DEVICE`), the trimmed raw value, a normalized lookup key, and a display label. One owner SHALL have at most one alias per kind and normalized key. The raw value SHALL be capped at 120 characters and the label at 60. The migration SHALL be additive and SHALL NOT change existing rows.

#### Scenario: An alias belongs to one owner and one kind

- **WHEN** an alias row is stored
- **THEN** it names its owner, its kind, its raw value, its normalized key, and its label
- **AND** another owner's identical source is a separate row

#### Scenario: Case and whitespace do not duplicate an alias

- **WHEN** the same owner stores an alias for `Garmin Connect` and later for `garmin  connect` of the same kind
- **THEN** the normalized key makes them the same alias
- **AND** the second write cannot create a duplicate row

#### Scenario: The limits are enforced

- **WHEN** a raw value is longer than 120 characters or a label is longer than 60
- **THEN** the write is refused

### Requirement: The owner sees a read-only source-names page

The system SHALL provide an owner-only page at `/my/source-aliases` that requires authentication, lists only the signed-in owner's aliases grouped by kind, and shows an empty state when none exist. The page SHALL NOT offer creation, editing, deletion, or application to tracks in this slice.

#### Scenario: The owner opens the page with no aliases

- **WHEN** a signed-in owner with no aliases opens `/my/source-aliases`
- **THEN** the page shows the explanation and the empty state
- **AND** no alias is created

#### Scenario: The owner sees only their aliases

- **WHEN** an owner opens the page and has stored aliases
- **THEN** the page lists their apps and devices with the raw value and the display label
- **AND** another owner's aliases are not shown

#### Scenario: The page has no mutation controls

- **WHEN** the owner opens the page
- **THEN** there is no add, edit, or delete control
- **AND** no alias is sent to the badges or the map legend yet

#### Scenario: Authentication is required

- **WHEN** an anonymous visitor requests `/my/source-aliases`
- **THEN** the page requires sign-in
- **AND** no alias data is returned
