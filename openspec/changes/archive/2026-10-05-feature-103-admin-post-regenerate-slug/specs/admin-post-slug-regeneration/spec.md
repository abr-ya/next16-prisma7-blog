# Spec Delta

## Purpose

Lets administrators deliberately restore a title-derived blog post slug without overriding a manual URL choice automatically.

## ADDED Requirements

### Requirement: Administrator-controlled post slug regeneration

The system SHALL provide an explicit `Regenerate slug` control beside the slug input on the shared administrator post create and edit forms. Activating the control SHALL replace the form's slug value with the current title converted by the existing post slug-generation rules, mark the form value for validation and saving, and SHALL NOT persist the replacement until the administrator submits a valid form.

#### Scenario: Administrator regenerates a manually edited slug

- **WHEN** an administrator enters or changes a title and activates `Regenerate slug` on `/admin/posts/new` or `/admin/posts/[id]`
- **THEN** the slug input displays the title-derived value before submission
- **AND** a prior manually entered slug is replaced only by that explicit action
- **AND** the post is saved through the existing create or update workflow only after the administrator selects `Save changes`

#### Scenario: Title changes without explicit regeneration

- **WHEN** an administrator changes the title while the slug input already contains a value and does not activate `Regenerate slug`
- **THEN** the existing slug value remains unchanged
- **AND** the administrator can continue to edit the slug directly

#### Scenario: Regeneration cannot produce a valid slug

- **WHEN** the current title produces an empty or invalid slug under the existing generation rules and an administrator activates `Regenerate slug`
- **THEN** the form retains its current slug value
- **AND** the existing form validation and save behavior remain in effect

### Requirement: Existing slug persistence safeguards remain authoritative

The system SHALL preserve the existing post-slug uniqueness validation and save-time error behavior after a slug is regenerated. The feature SHALL NOT add automatic URL redirects or alter public blog-route behavior.

#### Scenario: Regenerated slug conflicts with another post

- **WHEN** an administrator submits a regenerated slug that conflicts with another post's slug
- **THEN** the existing create or update workflow rejects the conflicting save according to its current uniqueness behavior
- **AND** no post URL is changed by regeneration alone
