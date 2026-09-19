## Purpose

Defines reliable save availability for administrators creating and editing blog posts.

## ADDED Requirements

### Requirement: Valid post forms enable saving without unrelated interaction

The system SHALL enable the `Save changes` action on the admin post create and edit forms as soon as all required form values are valid, without requiring blur, scrolling, or another unrelated interaction.

#### Scenario: Administrator completes a valid new post

- **WHEN** an administrator supplies valid required values on `/admin/posts/new`
- **THEN** the `Save changes` action becomes enabled without an unrelated interaction
- **AND** submitting the form continues through the existing post creation workflow

#### Scenario: Administrator fixes an invalid existing post field

- **WHEN** an administrator corrects the last invalid required value while editing a post
- **THEN** the `Save changes` action becomes enabled without requiring focus to move elsewhere
- **AND** existing inline validation feedback remains available

#### Scenario: Form remains invalid or submits

- **WHEN** a required value is invalid or a create/update request is in progress
- **THEN** the `Save changes` action remains disabled
- **AND** the form does not submit invalid or duplicate requests
