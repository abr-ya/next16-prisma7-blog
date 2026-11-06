# workspace-localization Specification

## Purpose

Keeps the owner workspace readable in the interface language the user chose, covering the account-menu entries, the four `/my/*` page titles, and the shared table and confirmation controls those pages render.

## Requirements

### Requirement: Owner workspace navigation and page titles follow the interface language

The signed-in user menu SHALL render its **Profile**, **My tracks**, **My routes**, **My workouts**, and **My gear** entries and its avatar alternative text from localized resources in the active interface language. The four owner pages (`/my/tracks`, `/my/workouts`, `/my/gear`, `/my/routes`) SHALL render their visible page title in that same language. English and Russian SHALL both provide a value for every key, and database-backed content such as track, gear, and route names SHALL remain untranslated.

#### Scenario: English interface shows English workspace labels

- **WHEN** a signed-in user opens the account menu with English selected
- **THEN** the entries read Profile, My tracks, My routes, My workouts, and My gear
- **AND** each owner page heading reads its English title

#### Scenario: Russian interface shows Russian workspace labels

- **WHEN** a signed-in user switches the interface to Russian and opens the account menu
- **THEN** the entries and the avatar alternative text are Russian
- **AND** each owner page heading is Russian
- **AND** a track, gear item, or route created with an English name still shows that name unchanged

#### Scenario: Language change applies to the workspace

- **WHEN** the user changes the language from the public navbar while on an owner page
- **THEN** the menu and the page heading render in the new language after the existing refresh
- **AND** no owner page needs a manual reload or a second language switch

#### Scenario: Unsupported locale falls back safely

- **WHEN** the resolved interface language is not English or Russian
- **THEN** the workspace labels fall back to English
- **AND** no raw translation key is rendered

### Requirement: Shared table and confirmation controls follow the interface language

The shared table and confirmation primitives SHALL render their own user-facing copy in the active interface language: the empty state, the page summary, the previous/next accessible names, the default confirmation and cancel labels, and the delete-row confirmation label. Explicit labels passed by a caller SHALL continue to override the localized defaults.

#### Scenario: Empty workspace table in Russian

- **WHEN** a Russian-interface owner page renders a table with no rows
- **THEN** the empty state is Russian instead of "No results."

#### Scenario: Paginated workspace table in Russian

- **WHEN** a Russian-interface workspace table shows a page
- **THEN** the page summary and the previous/next accessible names are Russian
- **AND** the page numbers still match the rendered rows

#### Scenario: Confirmation dialog in Russian

- **WHEN** a Russian-interface workspace action asks for confirmation without explicit labels
- **THEN** the confirm and cancel buttons are Russian
- **AND** the delete-row confirmation button reads the Russian equivalent of "Delete"

#### Scenario: Explicit labels win

- **WHEN** a caller passes its own confirm or cancel label
- **THEN** that label is rendered instead of the localized default

#### Scenario: Shared primitives stay consistent across surfaces

- **WHEN** the same shared table or confirmation primitive renders on an admin page
- **THEN** it uses the same active-language copy as on the workspace page
- **AND** sorting, pagination, and confirmation behavior are unchanged
