# Design

## Duration Formatter

`formatTrackDuration` keeps its signature and returns a human string or `null` for a non-finite value.

Rules, applied to `Math.max(0, Math.round(seconds))`:

| Total seconds | Output |
| --- | --- |
| `0` | `0 min` |
| `45` | `45 s` |
| `60` | `1 min` |
| `61` | `1 min 1 s` |
| `5310` | `1 h 28 min 30 s` |
| `3630` | `1 h 30 s` |
| `3600` | `1 h` |

A zero unit is omitted, except that a non-zero duration always keeps at least one unit and zero stays `0 min`. This is the smallest change that shows the stored precision without making whole-minute durations noisy.

Every current caller goes through this helper, so the public header (`Total` / `Moving`), the `/tracks` summary, the workouts **Duration** and **Moving** columns, the trip card, and the quick-upload preview all gain the seconds together. No surface keeps its own rounding.

## Labels

A new `getPublicTrackRecordingLabel(track)` in `lib/track-effective-values.ts` returns:

- `Logged` when `timeSource === "MANUAL"`;
- `Recorded` when `timeSource === "GPX"`;
- `Time` when `timeSource` is `null` (an unclassified row);
- the same `Recorded` fallback when a future enum value appears.

`formatTrackRecordingLine` changes its unknown sentence from `Recording time not recorded` to `Time not recorded`, and exports that text so the detail page can hide the label when the line is the unknown sentence. The header then never reads `Recorded · Recording time not recorded`.

The kind badge is derived from the existing `hasPrimaryRoute` flag: `Route track` with the current `Route` icon for a route-primary workout, `GPX track` otherwise. The same rule applies to the detail header and the `/tracks` list card.

## Trip Card

`trackRecordingStartLabel` and `trackRecordingDurationLabel` are used only by the trip linked-track card. Their English values become `Start` and `Duration`, their Russian values `Начало` and `Длительность`. The keys stay, so no call site changes and the admin form keeps its own input labels.

## Risks

- **Noisy durations.** A track with a 1-second remainder now shows three units; that is the truth the owner asked for, and the formatter omits zero units.
- **Spec text drift.** The existing `timeSource` requirement describes the trip card as rendering `Recording start` / `Recording duration`; the delta modifies that scenario to the neutral labels.
- **Unclassified rows.** `Time` is deliberately neutral because a `null` source can be a completed draft whose parse failed.
- **Unknown line.** Hiding the label depends on comparing the exported sentence; the constant keeps the page and the formatter in sync.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx tsx scripts/check-track-duration-format.ts`, `npx openspec validate --changes --strict`, and a production build. The script covers zero, a sub-minute duration, an exact minute, a minute with seconds, an hour with minutes and seconds, an hour with only seconds, and a null value. Browser checks are deferred to a manual QA candidate and create no data.
