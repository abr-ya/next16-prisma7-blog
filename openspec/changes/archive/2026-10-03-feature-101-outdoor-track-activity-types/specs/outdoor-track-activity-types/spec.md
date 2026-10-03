# Spec Delta

## Purpose

Defines reusable activity types for individual GPX tracks, with safe administrator lifecycle controls and owner-selected classification that does not alter trip types.

## ADDED Requirements

### Requirement: Administrators manage reusable track activity types

The system SHALL allow administrators to create activity types with a unique English default name, an optional Russian name, rename either name, and change whether they are active, while preserving each type's stable identity and existing track assignments.

#### Scenario: Administrator creates an activity type

- **WHEN** an administrator submits a non-empty English activity-type name that is not already in use under the system's normalized English-name comparison
- **THEN** the system creates an active activity type
- **AND** it makes the type available for track classification

#### Scenario: Duplicate activity-type name is rejected

- **WHEN** an administrator submits an English name that conflicts with an existing activity type under the system's normalized English-name comparison
- **THEN** the system rejects the mutation with a validation error
- **AND** it does not create or rename an activity type

#### Scenario: Russian name falls back to English

- **WHEN** a Russian-interface viewer reads an activity type without a Russian name
- **THEN** the system displays its English name
- **AND** it does not treat the missing translation as an invalid classification

#### Scenario: Administrator deactivates an assigned type

- **WHEN** an administrator deactivates an activity type that is assigned to one or more tracks
- **THEN** the system preserves those existing assignments
- **AND** it prevents the type from being newly selected or reselected

### Requirement: Activity-type deletion preserves classified tracks

The system SHALL allow deletion only for an activity type that is unused, or require an administrator to explicitly reassign every affected track to another active type or to unclassified before deletion.

#### Scenario: Administrator deletes an unused type

- **WHEN** an administrator deletes an activity type with no assigned tracks
- **THEN** the system removes the activity type
- **AND** no track record is modified

#### Scenario: Administrator attempts to delete an assigned type

- **WHEN** an administrator requests deletion of an activity type assigned to tracks without an explicit replacement or clear-classification instruction
- **THEN** the system rejects the deletion
- **AND** it reports that assignments must be handled first

#### Scenario: Administrator deletes an assigned type after explicit reassignment

- **WHEN** an administrator explicitly reassigns all tracks using an activity type to another active type or clears their classifications as part of deletion
- **THEN** the system updates the affected tracks and removes the original type atomically
- **AND** it preserves the tracks' other metadata, ownership, visibility, files, and parse data

### Requirement: Owners classify their own tracks with active activity types

The system SHALL let a track owner select an active activity type or leave the classification empty when creating or editing that owner's track, and SHALL enforce the same rule server-side.

#### Scenario: Owner selects an active activity type

- **WHEN** a track owner saves their track with an active activity type
- **THEN** the system stores the association on that track
- **AND** it retains the track's existing trip association and GPX metadata

#### Scenario: Owner leaves a track unclassified

- **WHEN** a track owner creates or edits a track without an activity type
- **THEN** the system saves the track as unclassified
- **AND** it does not require a synthetic `Not selected` activity-type record

#### Scenario: Owner submits an inactive or missing activity type

- **WHEN** a track owner submits an inactive or nonexistent activity type for a create or update operation
- **THEN** the system rejects the mutation
- **AND** it preserves the prior track classification when one exists

#### Scenario: User targets another owner's track

- **WHEN** a signed-in user attempts to set or clear the activity type of another user's track
- **THEN** the system denies the mutation
- **AND** it leaves the other track unchanged

### Requirement: Existing tracks remain unclassified after rollout

The system SHALL preserve all existing tracks without assigning an activity type during the data migration and SHALL represent their empty classification clearly on authenticated management surfaces.

#### Scenario: Existing track is read after migration

- **WHEN** a track created before activity types are introduced is read after deployment
- **THEN** the system returns it with no activity-type association
- **AND** its existing title, slug, visibility, owner, GPX file, timezone, parsed metadata, and trip association remain unchanged

#### Scenario: Owner views an unclassified track

- **WHEN** a track owner views an existing unclassified track in an authenticated management surface
- **THEN** the interface identifies it as unclassified or not selected
- **AND** it offers selection only from active activity types

### Requirement: Track activity type is independent from trip type

The system SHALL treat track activity type as independent from the fixed type of any associated trip and SHALL not copy, infer, or overwrite either value automatically.

#### Scenario: Track is attached to a typed trip

- **WHEN** a track with an activity type is attached to a trip with a fixed trip type
- **THEN** the system preserves both values independently
- **AND** it does not require them to match

#### Scenario: Track is attached to a trip without classification

- **WHEN** an unclassified track is attached to a trip with a fixed trip type
- **THEN** the track remains unclassified
- **AND** no automatic activity-type assignment occurs
