## ADDED Requirements

### Requirement: Public navbar supports language switching

The system SHALL provide a language switcher in the shared public navbar for the supported public locales.

#### Scenario: Visitor changes public navbar language

- **WHEN** a visitor opens a public content page that includes the shared public navbar
- **THEN** the navbar exposes controls for English and Russian
- **AND** selecting a supported locale updates the active public locale
- **AND** the visitor remains within the matching public navigation context

#### Scenario: Signed-in user changes public navbar language

- **WHEN** a signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar exposes controls for English and Russian
- **AND** selecting a supported locale updates the active public locale
- **AND** the navbar continues to show the authenticated account menu

### Requirement: Public navbar renders localized navigation labels

The system SHALL render shared public navbar labels using the active public locale for supported translations while preserving the existing navigation targets and utility controls.

#### Scenario: English public navbar labels render

- **WHEN** the active public locale is English
- **THEN** the shared public navbar labels render in English
- **AND** the Home, Blog, Docs, Videos, and Comments links continue to point to their matching public sections
- **AND** the back navigation, search placeholder access, and auth-aware login or account access remain available

#### Scenario: Russian public navbar labels render

- **WHEN** the active public locale is Russian
- **THEN** the shared public navbar labels render in Russian
- **AND** the Home, Blog, Docs, Videos, and Comments links continue to point to their matching public sections
- **AND** the back navigation, search placeholder access, and auth-aware login or account access remain available

#### Scenario: Unsupported locale falls back safely

- **WHEN** the public navbar is requested with no supported active locale
- **THEN** the system falls back to the default public locale
- **AND** the shared public navbar remains usable
