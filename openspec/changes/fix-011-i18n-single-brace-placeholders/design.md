# Design

## Context

See proposal.md — Why for the motivation and the source-level evidence.

The four affected keys and their call sites, all confirmed by reading the code:

| Key | Call site | Value passed |
| --- | --- | --- |
| `trackEditorDistanceLabel` | `components/track-pages/track-editor.tsx:200` | `distanceLabel` — the formatted distance |
| `trackEditorMapSelectedPointAria` | `components/track-pages/track-editor-map.tsx:136` | `index + 1` — the one-based point number |
| `trackTimeSourceBadgeLabel` | `components/hike-pages/hike-trip-media.tsx:269` | the localized `timeSource` label, itself a `t()` call |
| `photoTimezoneDialogTitleWithPhoto` | `components/hike-pages/hike-photo-gallery.tsx:622` | `timezonePhoto.title` — the photo title |

All four components are `"use client"` and read the copy through `useT(tripsNamespace)`, the same client instance the rest of the app uses. The `trips` namespace is already loaded for both languages in `app/layout.tsx:35`.

Two facts about the interpolation setup constrain the approach:

- **The prefix and the suffix are i18next's defaults.** `i18next@26.4.0` sets `prefix: "{{"` and `suffix: "}}"` (`node_modules/i18next/dist/esm/i18next.js:1736-1738`), and neither next-i18next instance overrides them — the client provider (`node_modules/next-i18next/dist/appRouter/client.mjs:63`) and the server instance (`node_modules/next-i18next/dist/appRouter/server.mjs:102`) each set only `interpolation: { escapeValue: false }`.
- **`escapeValue: false` is load-bearing.** With escaping off, a photo titled `Bob's photo` renders its apostrophe as an apostrophe. Turning escaping on would turn it into `Bob&#39;s photo` — a new defect in the very strings this change repairs.

The `quickWorkout` block in the same locale file already uses `{{ }}` (`statsSummary`, `rememberGearLabel`) and already renders correctly, so the project's placeholder syntax is settled and there is a working precedent in the file being edited.

## Goals / Non-Goals

**Goals:**

- Make the four strings render their value, in both languages, with no change to the wording around the placeholder.
- Keep the change to data: eight template strings and one guard script.
- Leave a check that fails loudly if a single-brace placeholder appears in any locale file again.

**Non-Goals:**

- Changing the interpolation configuration. `i18n.config.ts` and the `I18nProvider` props in `app/layout.tsx` are read-only for this change.
- Changing any call site. They already pass their values.
- Changing the wording of any string — including the Russian strings that name the `Delete` key in English, which is correct because the key is labelled `Delete` in the UI.

## Decisions

### 1. Fix the templates, not the configuration

The four keys switch to `{{ }}`. The alternative — configuring the project to use single braces (`i18nextOptions: { interpolation: { prefix: "{", suffix: "}" } }` in `i18n.config.ts` for the server and an `i18nextOptions` prop on the `I18nProvider` for the client) — was rejected:

- it would require converting the two working `{{ }}` strings back to single braces, so the file would hold both syntaxes at once unless both were converted;
- it changes the placeholder syntax of every string in the app, including strings that have not been written yet;
- it touches both i18n instances to repair eight strings.

`{{ }}` is i18next's standard, is already the syntax of this file's `quickWorkout` block, and is what the two working strings use.

### 2. The call sites stay untouched

Every call site already passes its value, so the value never needed fixing — only the template that should consume it. Leaving the components alone also means the change cannot alter anything but the rendered text: no new prop, no renamed key, no changed conditional.

### 3. The guard is a static scan plus a runtime interpolation check

`scripts/check-locale-placeholders.ts` does two things, in the style of the existing `scripts/check-*.ts` helpers:

1. **Static scan** — walk all six locale JSON files and report any string containing a single-brace placeholder (`{name}`), with the file and the key.
2. **Runtime check** — build an i18next instance with the same interpolation settings next-i18next uses (`escapeValue: false`, default prefix and suffix) over the `trips` resources, and assert that each of the four keys renders its value and not the placeholder.

The static scan catches the class of defect at the source; the runtime check proves the specific keys interpolate. Both run without a database, without a network, and without the app.

### 4. `escapeValue: false` stays, and the specs say why

The config is not touched, so the inserted values are rendered as given. The "named value is rendered as given" scenario in each delta makes that observable behavior part of the contract rather than an accident of a dependency's default: a photo title with an apostrophe must read as typed.

### 5. The deltas are ADDED, not MODIFIED

The existing `outdoor-tracks` requirement *Place on map tab lets the viewer move and remove individual points on the map* already promises a label "of the form 'Selected point N. Press Delete to remove.'" — the spec is right and the implementation violates it, so there is nothing to modify. A MODIFIED delta would carry that requirement and its six scenarios through the archive without changing a word of it.

The new requirements therefore state the substitution rule where it is not stated yet: that a localized string renders the value it names instead of the placeholder as literal text. The `outdoor-tracks` delta covers the administrator/owner editor surfaces and the public trip surface separately, as the specs rules ask.

### 6. The scope is the four keys and the guard

A scan of all six locale files finds exactly four single-brace placeholders, all in `trips.json`. There is no wider sweep to do, and the guard script exists precisely so that a fifth one cannot slip in unnoticed.

## Risks / Trade-offs

- **[The guard script's i18next instance drifts from next-i18next's configuration]** → the script pins the two settings next-i18next sets (`escapeValue: false`, default prefix and suffix) and names them in its header comment, so a change in the dependency shows up as a change to read.
- **[A value that legitimately contains braces]** → none of the four values does: a formatted distance, an integer, a translated label, and a photo title. The "rendered as given" scenarios cover the case where a photo title does contain braces.
- **[The static scan produces a false positive on a string that means a literal brace]** → i18next has no escape for a literal single brace in a value string, so a single brace in a locale string is always a mistake today. If that ever changes, the script is the place to learn the new rule.
- **[The four strings are not covered by any test suite]** → the project has no test suite; the guard script and the owner's browser check are the coverage, which is why the browser check is a task rather than an assumption.

## Migration Plan

None. No schema, no data, no route, no permission change. The change is two locale files and one script; a revert is the same edit in reverse.

## Open Questions

None.
