# outdoor-gear-preferences Specification

## Purpose

Defines the owner's private preference that remembers one gear record per activity type — the pair the quick upload preselects for that kind of workout, chosen deliberately by the owner, marked on the gear page, and dropped when the gear record stops fitting the type.

## Requirements

### Requirement: The owner has one preferred gear item per activity type

The system SHALL keep, for each activity type, at most one gear record that the owner prefers for it, SHALL let the owner set, change, and clear that preference, and SHALL scope every one of those operations to the signed-in owner.

#### Scenario: Owner sets a preferred gear item

- **WHEN** a signed-in owner marks one of their own gear records as preferred for an activity type
- **THEN** the system stores that preference for that owner and that activity type
- **AND** it lists the gear record as the preferred one for that activity type

#### Scenario: Owner changes the preferred gear item

- **WHEN** a signed-in owner marks a different gear record as preferred for an activity type that already has one
- **THEN** the system stores the new gear record as the preferred one for that activity type
- **AND** it keeps exactly one preferred gear record for that owner and that activity type

#### Scenario: Owner clears the preferred gear item

- **WHEN** a signed-in owner clears the preference for an activity type
- **THEN** the system removes that preference
- **AND** it keeps the gear record itself

#### Scenario: Owner submits another owner's gear as the preference

- **WHEN** a signed-in owner submits a gear record that belongs to a different owner as their preference
- **THEN** the system refuses the change
- **AND** it stores no preference

#### Scenario: Owner submits a gear record for an unknown or inactive activity type

- **WHEN** a signed-in owner submits a preference for an activity type that is inactive or does not exist
- **THEN** the system refuses the change
- **AND** it stores no preference

### Requirement: A preferred gear item must fit its activity type

The system SHALL accept a preference only when the gear record fits the activity type, and SHALL treat a gear record with no activity type as fitting every activity type.

#### Scenario: Owner prefers gear that fits the activity type

- **WHEN** a signed-in owner prefers a gear record whose activity types include the activity type
- **THEN** the system stores the preference

#### Scenario: Owner prefers gear that does not fit the activity type

- **WHEN** a signed-in owner prefers a gear record whose activity types do not include the activity type
- **THEN** the system refuses the change
- **AND** it stores no preference

#### Scenario: Owner prefers unclassified gear

- **WHEN** a signed-in owner prefers a gear record that carries no activity type
- **THEN** the system stores the preference for that activity type

### Requirement: The owner chooses the preference deliberately

The system SHALL change a preference only when the owner asks for it, and SHALL NOT derive a preference from the gear the owner happened to pick for a workout.

#### Scenario: Owner saves a workout with a gear item and does not ask for a preference

- **WHEN** a signed-in owner saves a workout with a gear item and leaves the preference control untouched
- **THEN** the system attaches the gear item to that workout
- **AND** it leaves the preference for that activity type unchanged

#### Scenario: Owner saves a workout and asks for a preference

- **WHEN** a signed-in owner saves a workout with a gear item and asks for that gear item to become the preferred one for the activity type
- **THEN** the system stores the preference for that activity type
- **AND** it attaches the gear item to that workout

### Requirement: The preferred gear item is offered as the default for a workout of that type

The system SHALL offer the owner's preferred gear item as the default selection when the owner starts a workout of that activity type, and SHALL let the owner choose a different gear item for that workout.

#### Scenario: Owner starts a workout of the type

- **WHEN** a signed-in owner opens the quick upload for an activity type that has a preferred gear item
- **THEN** the system selects that gear item
- **AND** the owner can select a different gear item instead

#### Scenario: The owner saves a workout with a different gear item

- **WHEN** a signed-in owner changes the selected gear item and saves the workout without asking for a preference
- **THEN** the system attaches the chosen gear item to that workout
- **AND** it leaves the preference unchanged

### Requirement: The owner sees which gear item is preferred

The system SHALL show the owner which of their gear records is preferred for each activity type, and SHALL let the owner clear that preference from the same place.

#### Scenario: Owner opens the gear list

- **WHEN** a signed-in owner opens their gear page
- **THEN** the system marks the gear record that is preferred for an activity type
- **AND** it names that activity type on the mark

#### Scenario: Owner clears the preference from the gear list

- **WHEN** a signed-in owner clears the preference from the gear list
- **THEN** the system removes the preference
- **AND** the mark is gone from the list

### Requirement: A preference stops applying when its gear record stops fitting

The system SHALL drop the preference for an activity type when the owner removes that activity type from the preferred gear record, and SHALL drop every preference of a gear record when that record is deleted.

#### Scenario: Owner removes the activity type from the preferred gear record

- **WHEN** a signed-in owner removes an activity type from the gear record that is preferred for it
- **THEN** the system drops that preference
- **AND** it keeps the preferences for the activity types that remain on the record

#### Scenario: Owner deletes the preferred gear record

- **WHEN** a signed-in owner deletes the gear record that is preferred for an activity type
- **THEN** the system drops that preference
- **AND** it leaves every other preference unchanged

#### Scenario: An administrator deactivates the activity type

- **WHEN** an administrator deactivates an activity type that a preference is keyed by
- **THEN** the system keeps the preference
- **AND** it stops offering that type for new preferences

### Requirement: The preference stays private to its owner

The system SHALL keep every preference out of public pages, public track representations, shared feeds, and administrative listings.

#### Scenario: A visitor browses the public site

- **WHEN** a visitor browses the public pages of the site
- **THEN** no public page shows a preferred gear item, a preference, or a gear name

#### Scenario: An administrator browses the site

- **WHEN** an administrator opens an administrative listing of the site's content
- **THEN** no listing includes the owners' preferences or the gear records they point at

#### Scenario: One owner's preferences are not visible to another owner

- **WHEN** a signed-in user opens a page that shows preferences
- **THEN** the system shows only that user's own preferences
