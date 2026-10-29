# Spec Delta

## ADDED Requirements

### Requirement: Localized track interface copy renders the value it names

The system SHALL render the localized track interface copy with the value it names in place of the placeholder. A localized string that names a distance, a point number, or a source label SHALL render that value, and SHALL NOT render the placeholder itself as literal text.

#### Scenario: The place-on-map distance line names the measured distance

- **WHEN** an administrator or an owner opens the place-on-map tab of the track dialog with points placed on the map
- **THEN** the distance line renders the localized distance label with the measured distance in place of the placeholder
- **AND** it does not render the placeholder as literal text

#### Scenario: The selected map point names its number

- **WHEN** a viewer selects a placed point on the map in the place-on-map editor
- **THEN** the selected point's title renders the localized label with the point's one-based number in place of the placeholder
- **AND** it does not render the placeholder as literal text

#### Scenario: The public trip linked-track badge names the source

- **WHEN** a visitor opens the public trip page `/trips/[slug]` and a linked track carries a `Track.timeSource`
- **THEN** the linked-track card renders the localized source badge with the localized source label in place of the placeholder
- **AND** it does not render the placeholder as literal text

#### Scenario: The named value is rendered as given

- **WHEN** a localized track string names a value
- **THEN** the rendered text contains that value unchanged
- **AND** no character of the value is replaced by an escape sequence
