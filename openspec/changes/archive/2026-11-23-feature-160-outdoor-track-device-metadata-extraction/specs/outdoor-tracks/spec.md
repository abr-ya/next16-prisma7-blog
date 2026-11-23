# Spec Delta

## ADDED Requirements

### Requirement: A parsed GPX records its recording app and device

The parser SHALL record the `<gpx creator>` value as `recordingApp` and an explicitly named `device` or `deviceName` extension element as `deviceName`, as an additive `sourceInfo` object on the metadata. Both values SHALL be nullable, the object SHALL be written for a successful and a failed parse, and `TRACK_GPX_METADATA_VERSION` SHALL stay `v1`. The parser SHALL NOT infer a device from an unknown creator or from unrelated metadata. The `sourceInfo` capability SHALL join the parser capability list so an older parse becomes outdated.

#### Scenario: A creator is recorded as the app

- **WHEN** a GPX file names an app in its `<gpx creator>` attribute
- **THEN** the parsed metadata records it as `recordingApp`
- **AND** the value is trimmed and capped

#### Scenario: A device extension is recorded as the device

- **WHEN** the file carries a `device` or `deviceName` extension element, with or without a namespace prefix
- **THEN** the parsed metadata records its text as `deviceName`

#### Scenario: Unknown creator does not invent a device

- **WHEN** the file has a creator but no explicit device element
- **THEN** `deviceName` is null
- **AND** `recordingApp` keeps the creator value

#### Scenario: A file with no source still records the object

- **WHEN** the file names neither an app nor a device
- **THEN** `sourceInfo` is written with both values null
- **AND** the parser capability list includes `sourceInfo`

#### Scenario: An older parse stays readable

- **WHEN** a stored parse predates `sourceInfo`
- **THEN** its summary, map, and timeline remain readable
- **AND** it reports no source and becomes outdated for the update action

### Requirement: Track surfaces show the source and label the map legend

The public track detail page SHALL show a source badge when a device or app is known, preferring `deviceName` over `recordingApp`, and SHALL NOT duplicate the existing time-source badge for a manual workout. A multi-line map legend SHALL label each line with `deviceName`, then `recordingApp`, then `Manual route` for a manual or route-based primary, then the existing title. A single-line map SHALL keep its legend hidden.

#### Scenario: The detail page shows a known source

- **WHEN** a viewer opens a GPX workout with a parsed device or app
- **THEN** the header shows a source badge with the device name, or the app when no device exists

#### Scenario: A manual workout keeps one source badge

- **WHEN** a viewer opens a manual workout
- **THEN** the existing `Source: Manual` badge stays
- **AND** no additional source badge is shown

#### Scenario: The legend names each line

- **WHEN** a track page renders a primary line and a secondary recording
- **THEN** the legend labels the primary line by its device, app, or `Manual route`
- **AND** the secondary line uses its own device or app, falling back to `Original recording`

#### Scenario: A single line keeps no legend

- **WHEN** the map draws only one line
- **THEN** the legend stays hidden
- **AND** the line keeps its existing style

#### Scenario: An older parse offers the update action

- **WHEN** a GPX workout predates the source extraction
- **THEN** the page shows no source badge
- **AND** the general **Update track data** action is available to its owner
